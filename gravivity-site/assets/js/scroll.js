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
      // gsap only runs this function when AT LEAST ONE of these queries matches,
      // so every screen size needs a query of its own (desktop was missing before).
      mobile: "(max-width: 736px)",
      desktop: "(min-width: 737px)",
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

  /* ---------- YouTube: show a poster, load the real player only on click ---------- */
  document.querySelectorAll(".video-frame").forEach((frame) => {
    const id = frame.dataset.videoId;
    const poster = frame.querySelector(".video-poster");
    if (!poster) return;

    if (!id || id === "YOUR_VIDEO_ID") {
      frame.classList.add("is-empty"); // shows the "add your video ID" placeholder
      return;
    }

    poster.href = `https://www.youtube.com/watch?v=${id}`; // works even if JS fails
    poster.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`;

    poster.addEventListener("click", (e) => {
      e.preventDefault();
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      iframe.title = frame.dataset.title || "Video";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      poster.replaceWith(iframe);
    });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
});
