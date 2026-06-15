import { gsap } from 'gsap';

// ── Section config ────────────────────────────────────────────────────────────

const b = import.meta.env.BASE_URL;

const sections = [
  {
    // 0 — About
    bg: '#f8f8f8',
    main:   b + 'profile/profile.jpg',
    float1: b + 'work02-lumos/ss-index.jpg',
    float2: b + 'work02-lumos/ss-shop.jpg',
  },
  {
    // 1 — Eve
    bg: '#1a1a2e',
    main:   b + 'work01-eve/screenshots/05_PROFILE.png',
    float1: b + 'work01-eve/screenshots/04_DISCOGRAPHY.png',
    float2: b + 'work01-eve/screenshots/01_TOP.png',
  },
  {
    // 2 — Lumos & Musk
    bg: '#f5f0ea',
    main:   b + 'work02-lumos/ss-index.jpg',
    float1: b + 'work02-lumos/ss-shop.jpg',
    float2: b + 'work02-lumos/ss-discovery.jpg',
  },
  {
    // 3 — Beauty Portfolio
    bg: '#f8f2f5',
    main:   b + 'work04-beauty/Image (10).jpg',
    float1: b + 'work04-beauty/Image (9).jpg',
    float2: b + 'work04-beauty/Image (11).jpg',
  },
  {
    // 4 — すきまけしき
    bg: '#0f1014',
    main:   b + 'work03-sukima/ss-login.jpg',
    float1: b + 'work03-sukima/ss-home.jpg',
    float2: b + 'work03-sukima/ss-main.jpg',
  },
  {
    // 5 — Contact
    bg: '#fff0f8',
    main:   b + 'work04-beauty/Image (11).jpg',
    float1: b + 'work01-eve/screenshots/05_PROFILE.png',
    float2: b + 'work02-lumos/ss-reservation.jpg',
  },
];

const TOTAL = sections.length;

// ── DOM refs ──────────────────────────────────────────────────────────────────

const visualPanel = document.getElementById('visual-panel');

// A/B 2枚重ねスロット
const slots = [
  { a: document.getElementById('vp-main-a'), b: document.getElementById('vp-main-b') },
  { a: document.getElementById('vp-f1-a'),   b: document.getElementById('vp-f1-b')   },
  { a: document.getElementById('vp-f2-a'),   b: document.getElementById('vp-f2-b')   },
];
// 現在どちらが表面か（0 = a が前面）
const slotActive = [0, 0, 0];

const navDots         = Array.from(document.querySelectorAll('.nav-dot'));
const scrollIndicator = document.querySelector('.scroll-indicator');
const currentNumEl    = document.getElementById('current-num');
const totalNumEl      = document.getElementById('total-num');

if (totalNumEl) totalNumEl.textContent = String(TOTAL).padStart(2, '0');

// z-index: page 0 on top
document.querySelectorAll('.page').forEach(el => {
  el.style.zIndex = TOTAL - Number(el.dataset.page);
});

function pageEl(i) {
  return document.querySelector(`.page[data-page="${i}"]`);
}

const FLIP_DURATION = 1.0;
let currentSection = 0;
let isAnimating    = false;

// ── Visual panel update ───────────────────────────────────────────────────────

// 各スロットの「待機中のクロスフェード予約」
const pendingFades = [null, null, null];
let   bgCall       = null;

function applyPanel(index, flipDuration = FLIP_DURATION) {
  const cfg      = sections[index];
  const srcs     = [cfg.main, cfg.float1, cfg.float2];
  const midpoint = flipDuration * 0.5;
  const crossDurs = [0.5, 0.5, 0.5];

  // 背景色：前の予約をキャンセルして再スケジュール
  if (bgCall) bgCall.kill();
  bgCall = gsap.delayedCall(midpoint, () => {
    gsap.to(visualPanel, {
      backgroundColor: cfg.bg,
      duration: flipDuration * 0.8,
      ease: 'power1.inOut',
    });
  });

  srcs.forEach((src, i) => {
    const { a, b } = slots[i];
    const front = slotActive[i] === 0 ? a : b;
    const back  = slotActive[i] === 0 ? b : a;

    // 古いアニメ・予約をすべてキャンセルして状態をリセット
    if (pendingFades[i]) { pendingFades[i].kill(); pendingFades[i] = null; }
    gsap.killTweensOf(front);
    gsap.killTweensOf(back);
    slotActive[i] = slotActive[i] === 0 ? 1 : 0;

    gsap.set(front, { opacity: 1, zIndex: 1 });
    gsap.set(back,  { opacity: 0, zIndex: 2 });
    back.src = src;

    // midpoint 後にクロスフェード（画像未読込なら onload を待つ）
    pendingFades[i] = gsap.delayedCall(midpoint, () => {
      pendingFades[i] = null;
      const fade = () => {
        gsap.to(back,  { opacity: 1, duration: crossDurs[i], ease: 'power2.inOut' });
        gsap.to(front, { opacity: 0, duration: crossDurs[i], ease: 'power2.inOut' });
      };
      if (back.complete && back.naturalWidth > 0) {
        fade();
      } else {
        back.onload = fade;
      }
    });
  });
}

// ── Section switch ────────────────────────────────────────────────────────────

let pendingSection = -1;

function goToSection(index) {
  if (index === currentSection) return;
  if (isAnimating) {
    pendingSection = index;
    return;
  }
  isAnimating = true;
  pendingSection = -1;

  const from      = currentSection;
  const to        = index;
  const goForward = to > from;

  const pageRange = goForward
    ? Array.from({ length: to - from }, (_, i) => from + i)
    : Array.from({ length: from - to }, (_, i) => to + (from - to - 1 - i));

  pageRange.forEach((p, i) => {
    gsap.to(pageEl(p), {
      rotateY:  goForward ? -180 : 0,
      duration: FLIP_DURATION,
      delay:    i * 0.1,
      ease:     'power2.inOut',
    });
  });

  applyPanel(to, FLIP_DURATION);

  navDots[currentSection].classList.remove('active');
  navDots[to].classList.add('active');
  if (currentNumEl) currentNumEl.textContent = String(to + 1).padStart(2, '0');
  scrollIndicator.classList.toggle('hidden', to === TOTAL - 1);
  currentSection = to;

  const totalMs = (FLIP_DURATION + (pageRange.length - 1) * 0.1) * 1000;
  setTimeout(() => {
    isAnimating = false;
    if (pendingSection !== -1 && pendingSection !== currentSection) {
      goToSection(pendingSection);
    }
  }, totalMs + 60);
}

// ── Jump (nav dots) ───────────────────────────────────────────────────────────

function jumpToSection(index) {
  if (index === currentSection) return;

  document.querySelectorAll('.page').forEach(el => gsap.killTweensOf(el));
  isAnimating = false;

  for (let p = 0; p < TOTAL; p++) {
    const el = pageEl(p);
    if (el) gsap.set(el, { rotateY: p < index ? -180 : 0 });
  }

  applyPanel(index, 0.45);

  navDots[currentSection].classList.remove('active');
  navDots[index].classList.add('active');
  if (currentNumEl) currentNumEl.textContent = String(index + 1).padStart(2, '0');
  scrollIndicator.classList.toggle('hidden', index === TOTAL - 1);
  currentSection = index;

  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const targetY   = ((index + 0.5) / TOTAL) * maxScroll;
  window.removeEventListener('scroll', onScroll);
  window.scrollTo({ top: targetY, behavior: 'instant' });
  requestAnimationFrame(() => window.addEventListener('scroll', onScroll, { passive: true }));
}

// ── Scroll ────────────────────────────────────────────────────────────────────

let scrollTimer = null;

function onScroll() {
  const progress   = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  const newSection = Math.min(Math.floor(progress * TOTAL), TOTAL - 1);

  if (newSection === currentSection) return;

  pendingSection = newSection;

  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    scrollTimer = null;
    if (pendingSection !== currentSection && !isAnimating) {
      goToSection(pendingSection);
    }
  }, 80);
}

if (window.innerWidth > 768) {
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ── Touch swipe (mobile) ──────────────────────────────────────────────────────

let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dx) < Math.abs(dy)) return; // 縦スワイプは無視
  if (Math.abs(dx) < 40) return; // 短すぎるスワイプは無視

  if (dx < 0) {
    // 左スワイプ → 次のページ
    goToSection(Math.min(currentSection + 1, TOTAL - 1));
  } else {
    // 右スワイプ → 前のページ
    goToSection(Math.max(currentSection - 1, 0));
  }
}, { passive: true });

// ── Nav dots ──────────────────────────────────────────────────────────────────

navDots.forEach(dot => {
  dot.addEventListener('click', () => jumpToSection(Number(dot.dataset.target)));
});

// ── Init first section panel ──────────────────────────────────────────────────

const init = sections[0];
visualPanel.style.backgroundColor = init.bg;
// 初期表示：各スロットのa面にセット（b面は非表示）
slots[0].a.src = init.main;
slots[1].a.src = init.float1;
slots[2].a.src = init.float2;
slots.forEach(({ a, b }) => {
  gsap.set(a, { opacity: 1, zIndex: 1 });
  gsap.set(b, { opacity: 0, zIndex: 0 });
});
