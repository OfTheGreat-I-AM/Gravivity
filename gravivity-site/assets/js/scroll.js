gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  const path = document.getElementById("stroke-path");
  if (!path) return;

  const pathLength = path.getTotalLength();
  path.style.strokeDasharray = pathLength;

  // Respect "reduce motion": show the finished path, skip smooth scroll + animation
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    path.style.strokeDashoffset = 0;
    return;
  }
  path.style.strokeDashoffset = pathLength;

  // Smooth scrolling (also takes over your #anchor nav links)
  const lenis = new Lenis({ anchors: { offset: -110 } });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Draw the path as you scroll through .spotlight
  gsap.to(path, {
    strokeDashoffset: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".spotlight",
      start: "top center", // tutorial used "top top"; this starts drawing a bit earlier
      end: "bottom bottom",
      scrub: true,
    },
  });
});
