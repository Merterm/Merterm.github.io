// A soft, ephemeral field of drifting pastel light behind the research-interest
// word cloud, plus gentle mouse parallax on both the ambient points and the
// interest words themselves — everything reads as floating points at
// slightly different depths, not a filled rectangle.

const PALETTE = ["#1b6587", "#83c5be", "#b39cec", "#b9beff"];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

class Point {
  constructor(w, h) {
    this.baseX = rand(0, w);
    this.baseY = rand(0, h);
    this.depth = rand(0.15, 1);
    this.r = rand(1.5, 4) + this.depth * 5;
    this.color = PALETTE[Math.floor(rand(0, PALETTE.length))];
    this.alpha = rand(0.12, 0.3) * this.depth + 0.08;
    this.speed = rand(0.05, 0.15);
    this.phase = rand(0, Math.PI * 2);
    this.driftX = rand(w * 0.03, w * 0.08);
    this.driftY = rand(h * 0.03, h * 0.08);
  }

  update(t, parallax) {
    this.x =
      this.baseX +
      Math.cos(t * this.speed + this.phase) * this.driftX +
      parallax.x * this.depth * 0.6;
    this.y =
      this.baseY +
      Math.sin(t * this.speed * 1.2 + this.phase) * this.driftY +
      parallax.y * this.depth * 0.6;
  }

  draw(ctx) {
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4);
    g.addColorStop(0, this.color + Math.round(this.alpha * 255).toString(16).padStart(2, "0"));
    g.addColorStop(1, this.color + "00");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A few big, extremely soft washes of color so the panel never reads as a
// flat single tint — like faint watercolor breathing slowly beneath the dust.
class Wash {
  constructor(w, h, color) {
    this.baseX = rand(w * 0.2, w * 0.8);
    this.baseY = rand(h * 0.2, h * 0.8);
    this.r = rand(Math.min(w, h) * 0.5, Math.min(w, h) * 0.75);
    this.color = color;
    this.speed = rand(0.03, 0.08);
    this.phase = rand(0, Math.PI * 2);
    this.driftX = rand(w * 0.1, w * 0.2);
    this.driftY = rand(h * 0.1, h * 0.2);
  }

  update(t) {
    this.x = this.baseX + Math.cos(t * this.speed + this.phase) * this.driftX;
    this.y = this.baseY + Math.sin(t * this.speed * 1.1 + this.phase) * this.driftY;
  }

  draw(ctx) {
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
    g.addColorStop(0, this.color + "14");
    g.addColorStop(1, this.color + "00");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function initInterestGradient(containerSelector, canvasSelector, tagSelector) {
  const container = document.querySelector(containerSelector);
  const canvas = document.querySelector(canvasSelector);
  if (!container || !canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width, height, points, washes;

  function resize() {
    width = container.clientWidth;
    height = container.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round((width * height) / 9000);
    points = Array.from({ length: Math.max(18, Math.min(count, 40)) }, () => new Point(width, height));
    washes = PALETTE.map((color) => new Wash(width, height, color));
    measure();
  }

  // Mouse position, normalized to [-1, 1] from the container's center.
  const target = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };

  container.addEventListener("mousemove", (e) => {
    const rect = container.getBoundingClientRect();
    target.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    target.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });
  container.addEventListener("mouseleave", () => {
    target.x = 0;
    target.y = 0;
  });

  const tags = Array.from(container.querySelectorAll(tagSelector)).map((el) => {
    const weight = parseFloat(el.style.getPropertyValue("--w")) || 2;
    return {
      el,
      weight,
      depth: weight / 5,
      baseOpacity: 0.5 + weight * 0.09,
      // Slow, independent ambient drift so overlapping words don't stay
      // parked on top of each other — gentle enough to stay calm, not dizzying.
      phase: rand(0, Math.PI * 2),
      speed: rand(0.06, 0.11),
      ampX: rand(10, 18),
      ampY: rand(10, 18),
      // Filled in by measure() below.
      baseX: 0,
      baseY: 0,
      w: 0,
      h: 0,
    };
  });

  // Cache each word's anchor position (from its CSS left/top %) and its
  // natural size, so per-frame overlap checks don't force a layout reflow.
  function measure() {
    for (const tag of tags) {
      tag.baseX = (parseFloat(tag.el.style.left) / 100) * width;
      tag.baseY = (parseFloat(tag.el.style.top) / 100) * height;
      tag.w = tag.el.offsetWidth;
      tag.h = tag.el.offsetHeight;
    }
  }

  const start = performance.now();
  let lastFrame = 0;
  // Starts inactive: the panel is collapsed behind a click-to-reveal
  // teardrop, so there's no point animating it until it's actually open.
  // The caller flips this synchronously in the same click handler that
  // opens/closes the panel — no IntersectionObserver, no async lag, so
  // there's no stale-frame flash when it wakes back up.
  let active = false;

  function frame(now) {
    // Canvas `filter: blur()` is one of the costliest 2D-canvas operations,
    // and this scene's motion is slow and ambient — running the whole loop
    // at a throttled ~30fps (instead of 60fps) is visually indistinguishable
    // here but roughly halves the work, and pausing entirely while the tab
    // is backgrounded (or the panel is closed) stops burning CPU for a
    // scene nobody is looking at.
    if (!active || document.hidden) {
      requestAnimationFrame(frame);
      return;
    }
    if (now - lastFrame < 33) {
      requestAnimationFrame(frame);
      return;
    }
    lastFrame = now;

    const t = (now - start) / 1000;

    // Ease the parallax target so movement feels fluid, not jittery.
    eased.x += (target.x - eased.x) * 0.04;
    eased.y += (target.y - eased.y) * 0.04;

    // The radial gradients already fade smoothly to transparent on their
    // own, so an extra canvas-wide blur pass just multiplies cost for very
    // little visual gain — skip it.
    ctx.clearRect(0, 0, width, height);
    for (const w of washes) {
      w.update(t);
      w.draw(ctx);
    }
    const parallaxPx = { x: eased.x * 24, y: eased.y * 24 };
    for (const p of points) {
      p.update(t, parallaxPx);
      p.draw(ctx);
    }

    // A slow, coherent wave travels across the surface (a function of each
    // word's own position, not an independent per-word twinkle), giving
    // every word a z — how near/far it sits, like a celestial object
    // drifting in and out of a shallow 3D space.
    for (const tag of tags) {
      const wave =
        Math.sin(tag.baseX * 0.01 + t * 0.18) * Math.cos(tag.baseY * 0.008 - t * 0.13);
      tag.z = 0.35 + tag.depth * 0.65 + wave * 0.22;

      const driftX = Math.cos(t * tag.speed + tag.phase) * tag.ampX;
      const driftY = Math.sin(t * tag.speed * 1.15 + tag.phase) * tag.ampY;
      tag.dx = eased.x * 10 * tag.depth + driftX;
      tag.dy = eased.y * 10 * tag.depth + driftY;
      tag.scale = 0.88 + tag.z * 0.22;
      tag.blur = Math.max(0, (0.75 - tag.z)) * 1.6;
    }

    // Whichever word is nearer (higher z) wins an overlap — the one behind
    // it is hidden outright rather than blending into illegible overlap.
    const occluded = new Array(tags.length).fill(false);
    for (let i = 0; i < tags.length; i++) {
      const a = tags[i];
      const aw = (a.w * a.scale) / 2;
      const ah = (a.h * a.scale) / 2;
      const ax = a.baseX + a.dx;
      const ay = a.baseY + a.dy;
      for (let j = i + 1; j < tags.length; j++) {
        const b = tags[j];
        const bw = (b.w * b.scale) / 2;
        const bh = (b.h * b.scale) / 2;
        const bx = b.baseX + b.dx;
        const by = b.baseY + b.dy;
        const overlapX = Math.abs(ax - bx) < (aw + bw) * 0.82;
        const overlapY = Math.abs(ay - by) < (ah + bh) * 0.82;
        if (overlapX && overlapY) {
          occluded[a.z < b.z ? i : j] = true;
        }
      }
    }

    tags.forEach((tag, i) => {
      tag.el.style.transform = `translate(-50%, -50%) translate(${tag.dx.toFixed(2)}px, ${tag.dy.toFixed(2)}px) scale(${tag.scale.toFixed(3)})`;
      tag.el.style.filter = `blur(${tag.blur.toFixed(2)}px)`;
      tag.el.style.zIndex = Math.round(tag.z * 1000);
      tag.el.style.opacity = occluded[i] ? 0 : Math.min(1, tag.baseOpacity * (0.75 + tag.z * 0.25)).toFixed(2);
    });

    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);

  return {
    setActive(value) {
      active = value;
    },
  };
}
