<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  /** Libellés des paliers, du plus bas (index 0) au plus haut */
  labels: string[];
  /** Index du palier courant (0-based) */
  step: number;
  /** Affiche un aspect de verre brisé (ex. : partie échouée) */
  broken?: boolean;
}>();

// ---------- Géométrie (viewBox 0 0 200 500) ----------
const TOP = 20; // bord supérieur du verre
const BOTTOM = 480; // bas du verre
const BASE = 28; // épaisseur de "fond de verre" sous le 1er palier
const LEVEL_0 = BOTTOM - BASE;

// ---------- Forme du verre (type verre à bière de blé) ----------
// Profil = demi-largeur du verre [demi-largeur, y], interpolé en courbe douce (Catmull-Rom).
// Large au sommet, il s'affine progressivement puis s'évase très légèrement dans un pied épais.
// Pour changer la forme du verre, il suffit de modifier ces points.
const CX = 100;
const PROFILE_KEYS: [number, number][] = [
  [73, TOP], // bord supérieur (légèrement resserré)
  [75, 65], // point le plus large
  [72, 120],
  [65, 190],
  [54, 290],
  [47, 370],
  [50, 425], // partie la plus fine
  [60, 455],
  [68, 474] // léger évasement du pied
];
const RIM_HALF = PROFILE_KEYS[0]![0]; // demi-largeur au bord supérieur

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

// Échantillons [demi-largeur, y] du bord, de haut en bas
const PROFILE: [number, number][] = (() => {
  const k = PROFILE_KEYS;
  const pts: [number, number][] = [];
  const SAMPLES = 14;
  for (let i = 0; i < k.length - 1; i++) {
    const p0 = k[Math.max(i - 1, 0)]!;
    const p1 = k[i]!;
    const p2 = k[i + 1]!;
    const p3 = k[Math.min(i + 2, k.length - 1)]!;
    for (let s = 0; s < SAMPLES; s++) {
      const t = s / SAMPLES;
      pts.push([catmull(p0[0], p1[0], p2[0], p3[0], t), catmull(p0[1], p1[1], p2[1], p3[1], t)]);
    }
  }
  pts.push(k[k.length - 1]!);
  return pts;
})();

const f = (v: number) => v.toFixed(2);
const GLASS_PATH = (() => {
  const last = PROFILE[PROFILE.length - 1]!;
  const left = PROFILE.map(([h, y]) => `${f(CX - h)} ${f(y)}`);
  const right = [...PROFILE].reverse().map(([h, y]) => `${f(CX + h)} ${f(y)}`);
  const foot = last[0];
  return [
    `M${left.join(' L')}`,
    `Q${f(CX - foot - 1)} ${BOTTOM} ${f(CX - foot + 9)} ${BOTTOM}`,
    `H${f(CX + foot - 9)}`,
    `Q${f(CX + foot + 1)} ${BOTTOM} ${f(CX + last[0])} ${f(last[1])}`,
    `L${right.join(' L')} Z`
  ].join(' ');
})();

// Zone libre au-dessus du bord supérieur : c'est là que la mousse peut dépasser.
// Plus large que le verre : les bosses des bords ne sont jamais coupées, même quand elles "respirent".
const FOAM_DOME = (() => {
  const w = RIM_HALF + 24;
  const h = 30; // hauteur max de dépassement
  return `M${CX - w} ${TOP} V${TOP - h} H${CX + w} V${TOP} Z`;
})();

// Contour sans la ligne du haut : la mousse peut dépasser, le bord supérieur est dessiné à part
const GLASS_OUTLINE = GLASS_PATH.replace(/\s*Z$/, '');

// Bord gauche du verre à la hauteur y (le bord droit est symétrique : 200 - x)
const leftEdge = (y: number) => {
  for (let i = 1; i < PROFILE.length; i++) {
    const [h0, y0] = PROFILE[i - 1]!;
    const [h1, y1] = PROFILE[i]!;
    if (y <= y1) {
      const t = y1 === y0 ? 0 : (y - y0) / (y1 - y0);
      return CX - (h0 + (h1 - h0) * Math.min(Math.max(t, 0), 1));
    }
  }
  return CX - PROFILE[PROFILE.length - 1]![0];
};

// Reflet : suit le bord gauche, légèrement à l'intérieur
const GLOSS_PATH = (() => {
  const pts: string[] = [];
  for (let y = 55; y <= 400; y += 15) pts.push(`${f(leftEdge(y) + 9)} ${y}`);
  return `M${pts.join(' L')}`;
})();

// ID unique pour les <clipPath>/<linearGradient> (au cas où le composant est utilisé 2 fois)
const uid = `beer-${Math.random().toString(36).slice(2, 8)}`;

// ---------- Paliers ----------
const n = computed(() => Math.max(props.labels.length, 1));
const current = computed(() => Math.min(Math.max(props.step, 0), n.value - 1));
const band = computed(() => (LEVEL_0 - TOP) / n.value);
const fontSize = computed(() => Math.min(15, band.value * 0.5));

const labelY = (i: number) => LEVEL_0 - (i + 0.5) * band.value;
// Surface du liquide pour le palier i : la mousse occupe exactement la bande du palier i
const surfaceY = (i: number) => LEVEL_0 - (i + 0.05) * band.value;

// Graduations (traits à la jonction de chaque bande, hors rim)
const ticks = computed(() =>
  Array.from({ length: n.value }, (_, k) => {
    const y = LEVEL_0 - k * band.value;
    const x = leftEdge(y);
    return { y, xl: x, xr: 200 - x };
  })
);

// ---------- Niveau (translateY) ----------
// On dessine liquide + mousse dans leur position "verre plein" (dernier palier),
// puis on les descend d'autant de bandes qu'il reste de paliers.
const offset = computed(() => (n.value - 1 - current.value) * band.value);
const levelStyle = computed(() => ({ transform: `translateY(${offset.value}px)` }));

const fullSurface = computed(() => surfaceY(n.value - 1));
const foamTop = computed(() => fullSurface.value - 0.95 * band.value);
const foamR = computed(() => Math.min(14, Math.max(7, band.value * 0.3)));
const FOAM_OUTLINE = 2.5; // épaisseur du contour nuageux

// Mousse : deux rangées de "nuages" (haut et bas) de même taille, autour d'un corps rectangulaire.
// Les motifs sont décalés pour que le bas ne soit pas un simple miroir du haut.
const foamBumps = computed(() => {
  const r = foamR.value;
  const gap = r * 1.5;
  const bumps: { cx: number; cy: number; r: number; delay: number; dur: number }[] = [];
  const radius = (k: number, seed: number) => r * (0.85 + (((k * seed) % 10) / 10) * 0.35);
  const row = (cy: number, xs: number[], seed: number) => {
    xs.forEach((x, k) => {
      bumps.push({
        cx: x,
        cy,
        r: radius(k, seed),
        delay: -((k + seed) % 5) * 0.8,
        dur: 3.2 + ((k + seed) % 4) * 0.7
      });
    });
  };
  // Haut : réparti d'un bord à l'autre du verre, les bosses extrêmes tangentes au bord
  // (contour compris) pour que la mousse au-dessus du bord soit arrondie sur les côtés, pas coupée
  const count = Math.ceil((2 * RIM_HALF) / gap);
  const x0 = CX - RIM_HALF + radius(0, 37) + FOAM_OUTLINE;
  const x1 = CX + RIM_HALF - radius(count, 37) - FOAM_OUTLINE;
  row(
    foamTop.value + 2,
    Array.from({ length: count + 1 }, (_, k) => x0 + (k * (x1 - x0)) / count),
    37
  );
  // Bas : décalé d'une demi-bosse, toujours dans le liquide (découpé par le verre)
  const start = 8 + gap / 2;
  row(
    fullSurface.value + 2,
    Array.from({ length: Math.ceil((210 - start) / gap) }, (_, k) => start + k * gap),
    53
  );
  return bumps;
});

// Couche 1 = contour nuageux, couche 2 = mousse blanche
const foamLayers = [
  { key: 'outline', grow: FOAM_OUTLINE, fill: '#e6c27c' },
  { key: 'body', grow: 0, fill: '#fffdf7' }
];

// ---------- Bulles ----------
const BUBBLES = [
  { x: 70, r: 2.2, dur: 5.5, delay: 0 },
  { x: 84, r: 3.2, dur: 7.0, delay: -2.1 },
  { x: 96, r: 1.8, dur: 4.6, delay: -3.4 },
  { x: 108, r: 2.8, dur: 6.4, delay: -1.2 },
  { x: 120, r: 2.0, dur: 5.1, delay: -4.0 },
  { x: 131, r: 3.0, dur: 7.4, delay: -5.2 },
  { x: 77, r: 1.6, dur: 4.2, delay: -0.8 },
  { x: 90, r: 2.4, dur: 6.0, delay: -4.6 },
  { x: 102, r: 1.5, dur: 4.0, delay: -2.8 },
  { x: 114, r: 2.6, dur: 6.8, delay: -3.0 },
  { x: 125, r: 1.8, dur: 4.8, delay: -1.7 },
  { x: 66, r: 2.0, dur: 5.8, delay: -5.0 },
  { x: 99, r: 3.4, dur: 8.0, delay: -6.2 },
  { x: 135, r: 1.6, dur: 4.4, delay: -2.4 }
];
// Distance de montée = du fond jusqu'à la surface courante
const rise = computed(() => `${Math.max(LEVEL_0 - 4 - surfaceY(current.value), 0)}px`);

// ---------- Verre brisé ----------
// Étoile de fissures générée une fois (pseudo-aléatoire fixe : toujours le même impact) :
// fissures radiales + branches + anneaux discontinus + facettes de verre plus ou moins claires.
const IMPACT = { x: 108, y: 215 };
const RADIALS = 9;

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const poly = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}`;

const CRACKS = (() => {
  const rnd = mulberry32(11);
  const radials: [number, number][][] = [];
  const paths: string[] = [];

  for (let k = 0; k < RADIALS; k++) {
    let a = (k / RADIALS) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
    let r = 0;
    const pts: [number, number][] = [[IMPACT.x, IMPACT.y]];
    for (let s = 0; s < 6; s++) {
      r += 16 + rnd() * 20;
      a += (rnd() - 0.5) * 0.3;
      pts.push([IMPACT.x + Math.cos(a) * r, IMPACT.y + Math.sin(a) * r]);
    }
    radials.push(pts);
    paths.push(poly(pts));

    // Petite branche qui part d'un point de la fissure
    if (rnd() > 0.35) {
      const from = pts[2 + Math.floor(rnd() * 2)]!;
      const ba = a + (rnd() > 0.5 ? 1 : -1) * (0.5 + rnd() * 0.5);
      const len = 18 + rnd() * 22;
      paths.push(
        poly([
          from,
          [from[0] + Math.cos(ba) * len * 0.5 + (rnd() - 0.5) * 4, from[1] + Math.sin(ba) * len * 0.5],
          [from[0] + Math.cos(ba) * len, from[1] + Math.sin(ba) * len]
        ])
      );
    }
  }

  // Anneaux irréguliers (avec des "trous" pour ne pas faire toile d'araignée)
  [1, 3].forEach((idx, ri) => {
    for (let k = 0; k < RADIALS; k++) {
      if ((k + ri) % 3 === 2) continue;
      paths.push(poly([radials[k]![idx]!, radials[(k + 1) % RADIALS]![idx]!]));
    }
  });

  // Facettes : quadrilatères entre deux fissures voisines, de clarté alternée
  const shards: { d: string; o: number }[] = [];
  (
    [
      [1, 3],
      [3, 5]
    ] as const
  ).forEach(([i0, i1], row) => {
    for (let k = 0; k < RADIALS; k++) {
      const a = radials[k]!;
      const b = radials[(k + 1) % RADIALS]!;
      shards.push({ d: `${poly([a[i0]!, a[i1]!, b[i1]!, b[i0]!])} Z`, o: (k + row) % 2 ? 0.12 : 0.03 });
    }
  });

  return { paths, shards };
})();

type LabelState = 'past' | 'current' | 'upcoming';
const stateOf = (i: number): LabelState => (i < current.value ? 'past' : i === current.value ? 'current' : 'upcoming');
</script>

<template>
  <svg
    aria-hidden="true"
    class="beer-glass block"
    overflow="visible"
    preserveAspectRatio="xMidYMid meet"
    viewBox="0 0 200 500"
  >
    <defs>
      <clipPath :id="`${uid}-clip`">
        <path :d="GLASS_PATH" />
      </clipPath>
      <!-- Mousse : même forme que le verre + une zone libre au-dessus du bord supérieur -->
      <clipPath :id="`${uid}-foam-clip`">
        <path :d="GLASS_PATH" />
        <path :d="FOAM_DOME" />
      </clipPath>
      <linearGradient
        :id="`${uid}-beer`"
        x1="0"
        x2="0"
        y1="0"
        y2="1"
      >
        <stop
          offset="0"
          stop-color="#fbbf24"
        />
        <stop
          offset="1"
          stop-color="#d97706"
        />
      </linearGradient>
    </defs>

    <!-- Intérieur du verre (légèrement teinté pour que les paliers à venir restent lisibles) -->
    <path
      :d="GLASS_PATH"
      fill="rgba(255,255,255,0.14)"
    />

    <g :clip-path="`url(#${uid}-clip)`">
      <!-- Liquide -->
      <g
        class="level"
        :style="levelStyle"
      >
        <rect
          :fill="`url(#${uid}-beer)`"
          height="700"
          width="200"
          x="0"
          :y="fullSurface"
        />
      </g>

      <!-- Bulles (non translatées : leur course est ajustée via --rise) -->
      <g :style="{ '--rise': rise }">
        <circle
          v-for="(b, i) in BUBBLES"
          :key="i"
          class="bubble"
          :cx="b.x"
          :cy="LEVEL_0 - 4"
          fill="rgba(255,255,255,0.55)"
          :r="b.r"
          :style="{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }"
        />
      </g>
    </g>

    <!-- Bord supérieur du verre (dessiné derrière la mousse) -->
    <line
      stroke="rgba(255,255,255,0.85)"
      stroke-linecap="round"
      stroke-width="3"
      :x1="CX - RIM_HALF"
      :x2="CX + RIM_HALF"
      :y1="TOP"
      :y2="TOP"
    />

    <!-- Mousse : peut dépasser du haut du verre -->
    <g :clip-path="`url(#${uid}-foam-clip)`">
      <g
        class="level"
        :style="levelStyle"
      >
        <g
          v-for="layer in foamLayers"
          :key="layer.key"
        >
          <rect
            :fill="layer.fill"
            :height="fullSurface - foamTop + layer.grow"
            width="210"
            x="-5"
            :y="foamTop + 2"
          />
          <circle
            v-for="(b, i) in foamBumps"
            :key="i"
            class="puff"
            :cx="b.cx"
            :cy="b.cy"
            :fill="layer.fill"
            :r="b.r + layer.grow"
            :style="{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }"
          />
        </g>
      </g>
    </g>

    <g :clip-path="`url(#${uid}-clip)`">
      <!-- Pied de verre épais -->
      <rect
        fill="rgba(255,255,255,0.22)"
        :height="BOTTOM - LEVEL_0"
        width="200"
        x="0"
        :y="LEVEL_0"
      />
      <line
        stroke="rgba(255,255,255,0.5)"
        stroke-width="1.5"
        x1="0"
        x2="200"
        :y1="LEVEL_0"
        :y2="LEVEL_0"
      />

      <!-- Verre brisé : facettes + fissures (ombre portée puis trait clair) -->
      <g
        v-if="broken"
        class="cracks"
      >
        <path
          v-for="(sh, i) in CRACKS.shards"
          :key="`s${i}`"
          class="shard"
          :d="sh.d"
          fill="#fff"
          :fill-opacity="sh.o"
        />
        <g
          fill="none"
          stroke-linejoin="round"
        >
          <path
            v-for="(d, i) in CRACKS.paths"
            :key="`u${i}`"
            class="crack"
            :d="d"
            pathLength="1"
            stroke="rgba(0,0,0,0.35)"
            stroke-width="2.6"
            :style="{ animationDelay: `${i * 0.012}s` }"
            transform="translate(0.8 0.8)"
          />
          <path
            v-for="(d, i) in CRACKS.paths"
            :key="`c${i}`"
            class="crack"
            :d="d"
            pathLength="1"
            stroke="rgba(255,255,255,0.9)"
            stroke-width="1.2"
            :style="{ animationDelay: `${i * 0.012}s` }"
          />
        </g>
      </g>
    </g>

    <!-- Contour du verre + reflet -->
    <path
      :d="GLASS_OUTLINE"
      fill="none"
      stroke="rgba(255,255,255,0.85)"
      stroke-linejoin="round"
      stroke-width="3"
    />
    <path
      :d="GLOSS_PATH"
      fill="none"
      stroke="rgba(255,255,255,0.28)"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="5"
    />

    <!-- Graduations (à l'extérieur du verre) -->
    <g
      stroke="rgba(255,255,255,0.7)"
      stroke-linecap="round"
      stroke-width="1.5"
    >
      <template
        v-for="(t, i) in ticks"
        :key="i"
      >
        <line
          :x1="t.xl - 9"
          :x2="t.xl - 2"
          :y1="t.y"
          :y2="t.y"
        />
        <line
          :x1="t.xr + 2"
          :x2="t.xr + 9"
          :y1="t.y"
          :y2="t.y"
        />
      </template>
    </g>

    <!-- Paliers -->
    <g
      dominant-baseline="central"
      text-anchor="middle"
    >
      <text
        v-for="(label, i) in labels"
        :key="label"
        class="label"
        :class="stateOf(i)"
        :font-size="stateOf(i) === 'current' ? fontSize * 1.15 : fontSize"
        x="100"
        :y="labelY(i)"
      >
        {{ label }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
.level {
  transition: transform 1.1s cubic-bezier(0.34, 1.3, 0.5, 1);
}

/* Bulles qui montent */
.bubble {
  animation-name: bubble-rise;
  animation-timing-function: ease-in;
  animation-iteration-count: infinite;
  opacity: 0;
}
@keyframes bubble-rise {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  85% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(calc(var(--rise) * -1));
    opacity: 0;
  }
}

/* Mousse : effet de "respiration" (zoom léger) */
.puff {
  transform-box: fill-box;
  transform-origin: center;
  animation-name: puff;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes puff {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.14);
  }
}

/* Verre brisé : les fissures se dessinent, les facettes apparaissent */
.crack {
  stroke-dasharray: 1 2;
  stroke-dashoffset: 1;
  animation: crack-draw 0.4s ease-out forwards;
}
@keyframes crack-draw {
  to {
    stroke-dashoffset: 0;
  }
}
.shard {
  animation: shard-in 0.5s ease-out 0.15s forwards;
  opacity: 0;
}
@keyframes shard-in {
  to {
    opacity: 1;
  }
}

/* Libellés */
.label {
  transition:
    fill 0.5s ease 0.3s,
    opacity 0.5s ease;
  font-weight: 600;
}
/* À venir : blanc cerclé de sombre → lisible sur verre vide quel que soit le fond.
   Pour du noir "classique" : fill: #0f172a; stroke: none; */
.label.upcoming {
  fill: #fff;
  stroke: rgba(0, 0, 0, 0.45);
  stroke-width: 3px;
  paint-order: stroke;
}
/* Passé : terne et barré, sur le liquide */
.label.past {
  fill: #78350f;
  opacity: 0.55;
  text-decoration: line-through;
}
/* Courant : sombre sur la mousse blanche */
.label.current {
  fill: #1e293b;
  font-weight: 800;
}

@media (prefers-reduced-motion: reduce) {
  .bubble,
  .puff {
    animation: none;
  }
  .bubble {
    opacity: 0;
  }
  .level {
    transition: none;
  }
  .crack {
    animation: none;
    stroke-dashoffset: 0;
  }
  .shard {
    animation: none;
    opacity: 1;
  }
}
</style>
