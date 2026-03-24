/* ============================================
   ELRISA CHEMICALS — Enhancements JS v2.0
   Layers ON TOP of main.js — do not replace it
   Link this AFTER main.js in your HTML
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Hero Word-by-Word Reveal ---
  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) {
    const html = heroTitle.innerHTML;
    let wordIndex = 0;

    // Split into HTML tags and text nodes, only wrap text words
    const newHtml = html.replace(/(<[^>]+>)|(\S+)/g, (match, tag, word) => {
      if (tag) {
        // It's an HTML tag — leave it alone
        return tag;
      }
      if (word) {
        const delay = 0.15 + (wordIndex * 0.08);
        wordIndex++;
        return `<span class="word" style="animation-delay: ${delay}s">${word}</span>`;
      }
      return match;
    });

    heroTitle.innerHTML = newHtml;
  }

  // --- Hero Floating Particles ---
  const hero = document.querySelector('.hero');
  if (hero) {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'hero-particles';
    hero.appendChild(particleContainer);

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'hero-particle';
      const size = 2 + Math.random() * 4;
      particle.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        width: ${size}px;
        height: ${size}px;
        --duration: ${6 + Math.random() * 8}s;
        --delay: ${Math.random() * 4}s;
        --dx: ${-40 + Math.random() * 80}px;
        --dy: ${-60 + Math.random() * 120}px;
      `;
      particleContainer.appendChild(particle);
    }
  }

  // --- Also observe .reveal-scale elements ---
  const scaleElements = document.querySelectorAll('.reveal-scale');
  if (scaleElements.length > 0) {
    const scaleObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          scaleObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    scaleElements.forEach(el => scaleObserver.observe(el));
  }

  // --- Split Image Subtle Parallax (desktop only) ---
  if (window.innerWidth > 768) {
    const splitImages = document.querySelectorAll('.split-img img');
    if (splitImages.length > 0) {
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            splitImages.forEach(img => {
              const rect = img.getBoundingClientRect();
              const viewH = window.innerHeight;
              if (rect.top < viewH && rect.bottom > 0) {
                const progress = (viewH - rect.top) / (viewH + rect.height);
                const shift = (progress - 0.5) * 16;
                img.style.transform = `translateY(${shift}px)`;
              }
            });
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }

  // --- Smoother Hero Parallax (override main.js version with rAF) ---
  const heroBg = document.querySelector('.hero-bg img');
  if (heroBg) {
    let heroTicking = false;
    // Remove old scroll listener by replacing the handler
    window.addEventListener('scroll', () => {
      if (!heroTicking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY;
          if (scrolled < window.innerHeight) {
            heroBg.style.transform = `translateY(${scrolled * 0.25}px) scale(1.1)`;
          }
          heroTicking = false;
        });
        heroTicking = true;
      }
    }, { passive: true });
  }

  // --- Top Bar: hide on scroll (desktop) ---
  const topBar = document.querySelector('.top-bar');
  const navbarEl = document.querySelector('.navbar');
  if (topBar && navbarEl && window.innerWidth > 640) {
    let topBarHeight = topBar.offsetHeight;
    window.addEventListener('scroll', () => {
      if (window.scrollY > topBarHeight) {
        topBar.style.transform = `translateY(-100%)`;
        topBar.style.position = 'fixed';
        topBar.style.top = '0';
        topBar.style.left = '0';
        topBar.style.right = '0';
      } else {
        topBar.style.transform = 'translateY(0)';
        topBar.style.position = 'relative';
      }
    }, { passive: true });

    // Add smooth transition
    topBar.style.transition = 'transform 0.3s ease';
  }

  // --- Smooth scroll with offset for navbar ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});