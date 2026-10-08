// Gravivity-specific behaviour (the template's own scripts live in main.js)

(function () {
	// Demo request form: placeholder until it's wired to a real backend / email service
	var form = document.getElementById('ctaForm');
	var note = document.getElementById('formNote');

	if (form) {
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var email = form.querySelector('input[type="email"]').value;
			note.textContent = "Thanks! We'll be in touch at " + email + ".";
			form.reset();
		});
	}

	// Footer year, so it never goes stale
	var year = document.getElementById('year');
	if (year) year.textContent = new Date().getFullYear();
})();


/* ==========================================================================
   ANIMATIONS: header waves + (optional) drops, readout, screenshot fade-in
   ========================================================================== */
(function () {
	document.documentElement.classList.add('gv-js');

	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var small = window.matchMedia('(max-width: 736px)').matches;

	// Size a canvas to its CSS size, sharp on high-DPI screens
	function fit(canvas) {
		var dpr = Math.min(window.devicePixelRatio || 1, 2);
		var r = canvas.getBoundingClientRect();
		canvas.width = Math.round(r.width * dpr);
		canvas.height = Math.round(r.height * dpr);
		var ctx = canvas.getContext('2d');
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		return { ctx: ctx, w: r.width, h: r.height };
	}

	// Only animate while the element is on screen (saves battery)
	function run(el, draw) {
		var running = false, last = 0;
		function frame(now) {
			if (!running) return;
			draw(Math.min((now - last) / 1000, 0.05), now / 1000);
			last = now;
			requestAnimationFrame(frame);
		}
		new IntersectionObserver(function (entries) {
			if (entries[0].isIntersecting && !running) {
				running = true; last = performance.now(); requestAnimationFrame(frame);
			} else if (!entries[0].isIntersecting) { running = false; }
		}).observe(el);
	}

	/* ---------- 1. Header: drops fall under gravity, hit the pool, make ripples.
	        The cursor acts as a gravity well that bends their path. ---------- */
	(function () {
		var canvas = document.getElementById('dropCanvas');
		var header = document.getElementById('header');
		if (!canvas || !header) return;

		var c = fit(canvas), ctx = c.ctx, W = c.w, H = c.h;
		// Set to true to bring the falling drops back. The pool, ripples-on-cursor and waves stay either way.
		var DROPS_ON = false;

		var G = 1100;                                   // gravity, px/s^2
		var drops = [], ripples = [], splashes = [];
		var mouse = { x: 0, y: 0, on: false }, spawn = 0;
		var COLORS = ['251,251,239', '251,251,239', '226,203,182', '243,227,221'];

		header.addEventListener('mousemove', function (e) {
			var r = canvas.getBoundingClientRect();
			mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
		});
		header.addEventListener('mouseleave', function () { mouse.on = false; });
		window.addEventListener('resize', function () { c = fit(canvas); ctx = c.ctx; W = c.w; H = c.h; });

		function draw(dt, t) {
			var sy = H - 28;                              // liquid surface
			ctx.clearRect(0, 0, W, H);

			// pool with a gently moving surface
			ctx.beginPath();
			for (var x = 0; x <= W; x += 10) {
				var y = sy + Math.sin(x * 0.02 + t * 1.6) * 2.2 + Math.sin(x * 0.007 - t * 0.9) * 2;
				if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
			}
			ctx.strokeStyle = 'rgba(226,203,182,0.75)'; ctx.lineWidth = 1.2; ctx.stroke();
			ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
			var g = ctx.createLinearGradient(0, sy, 0, H);
			g.addColorStop(0, 'rgba(251,251,239,0.14)'); g.addColorStop(1, 'rgba(251,251,239,0)');
			ctx.fillStyle = g; ctx.fill();

			// spawn new drops
			spawn += dt;
			var gap = 1 / (small ? 2 : 4.5);
			while (DROPS_ON && spawn > gap) {
				spawn -= gap;
				drops.push({ x: Math.random() * W, y: -10, vx: 0, vy: Math.random() * 60,
					r: 1.6 + Math.random() * 2.2, col: COLORS[Math.floor(Math.random() * COLORS.length)] });
			}

			// update + draw drops
			for (var i = drops.length - 1; i >= 0; i--) {
				var d = drops[i], ax = 0, ay = G;
				if (mouse.on) {                              // gravity well
					var dx = mouse.x - d.x, dy = mouse.y - d.y;
					var dist = Math.sqrt(dx * dx + dy * dy) + 1;
					var a = Math.min(2.2e7 / (dist * dist + 2500), 3000);
					ax += a * dx / dist; ay += a * dy / dist;
				}
				d.vx += ax * dt; d.vy += ay * dt;
				d.x += d.vx * dt; d.y += d.vy * dt;

				if (d.y >= sy) {                             // splash!
					ripples.push({ x: d.x, r: 2, max: 30 + d.r * 14, col: d.col });
					for (var k = 0; k < 4; k++)
						splashes.push({ x: d.x, y: sy, vx: (Math.random() - 0.5) * 140,
							vy: -(80 + Math.random() * 140), life: 0.55, col: d.col });
					drops.splice(i, 1); continue;
				}
				if (d.x < -60 || d.x > W + 60) { drops.splice(i, 1); continue; }

				ctx.lineCap = 'round';
				ctx.strokeStyle = 'rgba(' + d.col + ',0.5)'; ctx.lineWidth = d.r * 0.9;
				ctx.beginPath(); ctx.moveTo(d.x - d.vx * 0.025, d.y - d.vy * 0.025); ctx.lineTo(d.x, d.y); ctx.stroke();
				ctx.fillStyle = 'rgba(' + d.col + ',0.95)';
				ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.2832); ctx.fill();
			}

			// ripples
			for (var j = ripples.length - 1; j >= 0; j--) {
				var p = ripples[j]; p.r += dt * 60;
				if (p.r >= p.max) { ripples.splice(j, 1); continue; }
				var al = 1 - p.r / p.max;
				ctx.lineWidth = 1.2;
				ctx.strokeStyle = 'rgba(' + p.col + ',' + (al * 0.7) + ')';
				ctx.beginPath(); ctx.ellipse(p.x, sy, p.r, p.r * 0.25, 0, 0, 6.2832); ctx.stroke();
				ctx.strokeStyle = 'rgba(' + p.col + ',' + (al * 0.35) + ')';
				ctx.beginPath(); ctx.ellipse(p.x, sy, p.r * 0.6, p.r * 0.15, 0, 0, 6.2832); ctx.stroke();
			}

			// splash droplets
			for (var m = splashes.length - 1; m >= 0; m--) {
				var s = splashes[m];
				s.vy += G * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
				if (s.life <= 0 || s.y > sy) { splashes.splice(m, 1); continue; }
				ctx.fillStyle = 'rgba(' + s.col + ',' + (s.life * 1.4) + ')';
				ctx.beginPath(); ctx.arc(s.x, s.y, 1.3, 0, 6.2832); ctx.fill();
			}

			// the cursor's gravity well: rings contracting toward the pointer
			if (mouse.on) {
				for (var n = 0; n < 3; n++) {
					var rr = 78 - ((t * 35 + n * 26) % 78);
					ctx.strokeStyle = 'rgba(251,251,239,' + (0.35 * (1 - rr / 78)) + ')';
					ctx.lineWidth = 1;
					ctx.beginPath(); ctx.arc(mouse.x, mouse.y, rr, 0, 6.2832); ctx.stroke();
				}
				ctx.fillStyle = 'rgba(251,251,239,0.6)';
				ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 2, 0, 6.2832); ctx.fill();
			}
		}

		if (reduce) draw(0, 0); else run(header, draw);
	})();

	/* ---------- 2. Simulated readout: specific gravity drifts, batch moves planned -> completed ---------- */
	(function () {
		var sg = document.getElementById('sgValue'),
		    st = document.getElementById('batchState'),
		    lv = document.getElementById('levelBar');
		if (!sg || !st || !lv) return;

		var states = ['Planned', 'Mixing', 'Quality check', 'Completed'];
		var levels = [15, 48, 82, 100];
		var i = 1, v = 1.184;
		function show() { st.textContent = states[i]; lv.style.width = levels[i] + '%'; }
		show();
		if (reduce) return;

		setInterval(function () {
			v = Math.min(1.22, Math.max(1.15, v + (Math.random() - 0.5) * 0.006));
			sg.textContent = v.toFixed(3);
		}, 900);
		setInterval(function () { i = (i + 1) % states.length; show(); }, 2800);
	})();

	/* ---------- 3. Screenshots: fade in when scrolled into view, placeholder if image missing ---------- */
	(function () {
		var shots = document.querySelectorAll('.shot');
		shots.forEach(function (shot) {
			var img = shot.querySelector('img');
			function missing() { shot.classList.add('is-empty'); }
			if (img) {
				img.addEventListener('error', missing);
				if (img.complete && img.naturalWidth === 0) missing();
			}
		});
		if (reduce || !('IntersectionObserver' in window)) {
			shots.forEach(function (s) { s.classList.add('on'); });
			return;
		}
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
			});
		}, { threshold: 0.2 });
		shots.forEach(function (s) { io.observe(s); });
	})();
})();


/* ---------- Sticky nav: add "is-scrolled" once you leave the top, and mark the current section ---------- */
(function () {
	function onScroll() { document.body.classList.toggle('is-scrolled', window.scrollY > 40); }
	onScroll();
	window.addEventListener('scroll', onScroll, { passive: true });

	if (!('IntersectionObserver' in window)) return;
	var items = [].slice.call(document.querySelectorAll('#nav > ul > li > a[href^="#"]'))
		.map(function (a) { return { li: a.parentNode, sec: document.querySelector(a.getAttribute('href')) }; })
		.filter(function (x) { return x.sec; });

	var io = new IntersectionObserver(function (entries) {
		entries.forEach(function (e) {
			if (!e.isIntersecting) return;
			items.forEach(function (x) { x.li.classList.toggle('active', x.sec === e.target); });
		});
	}, { rootMargin: '-45% 0px -50% 0px' });   // a thin band across the middle of the screen
	items.forEach(function (x) { io.observe(x.sec); });
})();
