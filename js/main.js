/* ============================================
   ELRISA CHEMICALS LTD — Main JavaScript
   ============================================ */

// --- Email Protection ---
// Addresses are never written in the HTML, so spam bots scraping the source find nothing.
// Mark them up as <span data-eml="info"></span> or <a data-eml="career" data-eml-subject="...">;
// the address is assembled here in the browser.
window.elrisaEmails = (root) => {
  const domain = ['com', 'elrisachemical'].reverse().join('.');
  (root || document).querySelectorAll('[data-eml]').forEach((el) => {
    const addr = el.dataset.eml + String.fromCharCode(64) + domain;
    if (el.tagName === 'A') {
      const subject = el.dataset.emlSubject;
      el.href = 'mailto:' + addr + (subject ? '?subject=' + subject : '');
      if (!el.children.length && !el.textContent.trim()) el.textContent = addr;
    } else {
      el.textContent = addr;
    }
  });
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.elrisaEmails());
} else {
  window.elrisaEmails();
}

// --- Form Drafts ---
// Keeps what visitors type in a form (on their own device) until they send it or clear it,
// so leaving the page, refreshing or closing a popup never loses their answers.
// Use: <form data-draft="some-key">. Call elrisaDraft.clear(form) after a successful send.
window.elrisaDraft = (() => {
  const PREFIX = 'elrisa_draft_';
  const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // forget drafts after 30 days
  const SKIP = ['botcheck', 'website_url', 'h-captcha-response', 'g-recaptcha-response', 'access_key', 'redirect', 'subject', 'from_name'];
  const storeKey = (form) => form.dataset.draft ? PREFIX + form.dataset.draft : null;
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const drop = (k) => { try { localStorage.removeItem(k); } catch (e) {} };

  const fields = (form) => Array.from(form.elements).filter((el) =>
    el.tagName !== 'BUTTON' && el.tagName !== 'FIELDSET' &&
    !['hidden', 'password', 'file', 'submit', 'button', 'reset'].includes(el.type) &&
    !SKIP.includes(el.name) && !el.classList.contains('rq-hp') && el.getAttribute('aria-hidden') !== 'true');
  const fieldKey = (el, i) => el.id || (el.name ? (el.type === 'checkbox' || el.type === 'radio' ? el.name + '=' + el.value : el.name) : '#' + i);

  function save(form) {
    const k = storeKey(form);
    if (!k || form._draftPaused) return;
    const values = {};
    let filled = false;
    fields(form).forEach((el, i) => {
      if (el.type === 'checkbox' || el.type === 'radio') { values[fieldKey(el, i)] = el.checked; if (el.checked) filled = true; }
      else { values[fieldKey(el, i)] = el.value; if (el.value.trim()) filled = true; }
    });
    if (filled) write(k, { t: Date.now(), values }); else drop(k);
  }

  function notice(form, show) {
    let box = form.querySelector('.draft-notice');
    if (!show) { if (box) box.remove(); return; }
    if (box) return;
    box = document.createElement('div');
    box.className = 'draft-notice';
    box.setAttribute('role', 'status');
    box.innerHTML = '<span>Welcome back. We kept your answers on this device.</span><button type="button">Clear form</button>';
    box.querySelector('button').addEventListener('click', () => clear(form, true));
    form.insertBefore(box, form.firstChild);
  }

  function restore(form) {
    const k = storeKey(form);
    const saved = k && read(k);
    if (!saved || !saved.values || Date.now() - saved.t > MAX_AGE) { if (k) drop(k); notice(form, false); return false; }
    let count = 0;
    fields(form).forEach((el, i) => {
      const v = saved.values[fieldKey(el, i)];
      if (v === undefined) return;
      if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked !== v) { el.checked = v; el.dispatchEvent(new Event('change', { bubbles: true })); } if (v) count++; }
      else if (v !== '') { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); count++; }
    });
    notice(form, count > 0);
    if (count) form.dispatchEvent(new CustomEvent('elrisa:draft-restored', { detail: { count } }));
    return count > 0;
  }

  function clear(form, resetFields) {
    const k = storeKey(form);
    if (k) drop(k);
    notice(form, false);
    form._draftPaused = !resetFields; // after a successful send, don't re-save until they type again
    if (resetFields) {
      form.reset();
      fields(form).forEach((el) => { if (el.type === 'checkbox' || el.type === 'radio') el.dispatchEvent(new Event('change', { bubbles: true })); });
      form.dispatchEvent(new CustomEvent('elrisa:draft-cleared'));
    }
  }

  function bind(form) {
    if (form._draftBound) return;
    form._draftBound = true;
    let timer;
    const later = (e) => { if (e && e.isTrusted) form._draftPaused = false; clearTimeout(timer); timer = setTimeout(() => save(form), 250); };
    form.addEventListener('input', later);
    form.addEventListener('change', later);
    window.addEventListener('pagehide', () => save(form));
  }

  const init = () => document.querySelectorAll('form[data-draft]').forEach((form) => { bind(form); restore(form); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return { bind, restore, clear, save };
})();

// --- WhatsApp Chat Button ---
// Added to every page; the message names what the visitor was reading so we know what they want.
(function () {
  const addFab = () => {
    if (document.getElementById('waFab')) return; // page already has its own (e.g. BPO page)
    const topics = {
      'cnsl.html': 'cashew nut shell liquid (CNSL)',
      'cnsl-friction-materials.html': 'CNSL for friction materials',
      'polyols.html': 'bio-based polyols',
      'phenolic-resins.html': 'phenolic resins',
      'phenol-free-phenolic-resin.html': 'phenol-free phenolic resin',
      'contract-processing.html': 'contract processing',
      'export-supply.html': 'export supply',
      'laboratory.html': 'your laboratory services',
      'products.html': 'your products',
      'careers.html': 'careers at Elrisa'
    };
    const page = window.location.pathname.split('/').pop();
    const topic = topics[page] || 'your products';
    const text = "Hi Elrisa, I found you on your website and I'd like to ask about " + topic + '.';
    const a = document.createElement('a');
    a.id = 'waFab';
    a.className = 'fab-whatsapp';
    a.href = 'https://wa.me/233556395946?text=' + encodeURIComponent(text);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', 'Chat with Elrisa on WhatsApp');
    a.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
    document.body.appendChild(a);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addFab);
  else addFab();
})();

document.addEventListener('DOMContentLoaded', () => {

  // --- Page Loader ---
  const loader = document.querySelector('.page-loader');
  if (loader) {
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('hidden'), 400);
    });
    // Failsafe
    setTimeout(() => loader.classList.add('hidden'), 3000);
  }

  // --- Navbar Scroll ---
  const navbar = document.querySelector('.navbar');
  const topBar = document.querySelector('.top-bar');
  if (navbar) {
    const handleScroll = () => {
      const topBarHeight = topBar ? topBar.offsetHeight : 0;
      const isMobile = window.innerWidth <= 640;
      if (window.scrollY > (isMobile ? topBarHeight : 60)) {
        navbar.classList.add('scrolled');
        if (topBar && isMobile) topBar.classList.add('hidden');
      } else {
        navbar.classList.remove('scrolled');
        if (topBar && isMobile) topBar.classList.remove('hidden');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // --- Mobile Menu ---
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileOverlay = document.querySelector('.mobile-overlay');

  if (toggle && mobileMenu) {
    const openMenu = () => {
      toggle.classList.add('open');
      mobileMenu.classList.add('open');
      if (mobileOverlay) mobileOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      toggle.classList.remove('open');
      mobileMenu.classList.remove('open');
      if (mobileOverlay) mobileOverlay.classList.remove('open');
      document.body.style.overflow = '';
    };

    toggle.addEventListener('click', () => {
      if (mobileMenu.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (mobileOverlay) {
      mobileOverlay.addEventListener('click', closeMenu);
    }

    // Mobile accordion toggle (Products sub-menu)
    mobileMenu.querySelectorAll('.mobile-accordion-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.closest('.mobile-accordion').classList.toggle('open');
      });
    });

    // Close on link click (exclude accordion toggles)
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // --- Desktop Products Dropdown (click-toggle) ---
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.nav-dropdown-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      // Close all other dropdowns first
      dropdowns.forEach(d => d.classList.remove('open'));
      if (!isOpen) dropdown.classList.add('open');
      toggle.setAttribute('aria-expanded', !isOpen);
    });

    // Keyboard accessibility
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    dropdowns.forEach(d => {
      d.classList.remove('open');
      const t = d.querySelector('.nav-dropdown-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  });

  // Keep dropdown open when clicking inside the menu
  document.querySelectorAll('.nav-dropdown-menu').forEach(menu => {
    menu.addEventListener('click', (e) => e.stopPropagation());
  });

  // --- Scroll Reveal ---
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger');

  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // --- Counter Animation ---
  const counters = document.querySelectorAll('[data-count]');

  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || '';
          const prefix = el.dataset.prefix || '';
          const duration = 2000;
          const start = performance.now();

          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            el.textContent = prefix + current.toLocaleString() + suffix;

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => counterObserver.observe(el));
  }

  // --- Back to Top ---
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }, { passive: true });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Active nav link highlight ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // --- Smooth scroll for same-page anchors ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- Parallax on hero (subtle) ---
  const heroBg = document.querySelector('.hero-bg img');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroBg.style.transform = `translateY(${scrolled * 0.3}px) scale(1.1)`;
      }
    }, { passive: true });
  }

});
