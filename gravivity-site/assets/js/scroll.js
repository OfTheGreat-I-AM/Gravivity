gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* ---------- Lenis + nav clicks ---------- */
  if (!reduceMotion) {
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Capture phase = runs before the template's dropdown/panel handlers swallow the click
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a || a.closest("#titleBar")) return; // leave the mobile menu toggle alone
        const id = a.getAttribute("href");
        if (id.length < 2 || id === "#navPanel") return; // ignore "#" placeholders
        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        e.stopPropagation();
        document.body.classList.remove("navPanel-visible"); // close the mobile slide-out

        const margin =
          parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        lenis.scrollTo(target, { offset: -margin, duration: 1.4 });
      },
      true,
    );
  }

  /* ---------- Path drawing (separate desktop / mobile paths) ---------- */
  const mm = gsap.matchMedia();
  mm.add(
    {
      mobile: "(max-width: 736px)",
      reduce: "(prefers-reduced-motion: reduce)",
    },
    (ctx) => {
      const { mobile, reduce } = ctx.conditions;
      const path = document.getElementById(
        mobile ? "stroke-path-mobile" : "stroke-path-desktop",
      );
      if (!path) {
        console.warn("[scroll.js] SVG path element not found for this screen size");
        return;
      }

      const length = path.getTotalLength();
      if (!length) {
        console.warn('[scroll.js] Path has length 0 - is the d="..." attribute valid?', path);
        return;
      }
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = reduce ? 0 : length;
      if (reduce) return;

      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: ".spotlight",
          start: "top 60%", // tip sits 60% of the way down the screen...
          end: "bottom 60%", // ...and stays there until the spotlight ends
          scrub: true,
        },
      });
    },
  );

  window.addEventListener("load", () => ScrollTrigger.refresh());
});
