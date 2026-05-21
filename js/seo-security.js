/* ============================================
   ELRISA CHEMICALS — SEO, Cookies & Security
   ============================================ */

// Exposed immediately so form handlers can call these before DOMContentLoaded resolves
window.ElrisaForms = {
  isSpam: function(form) {
    const hp = form.querySelector('[name="website_url"]');
    if (hp && hp.value !== '') return true;
    const tf = form.querySelector('[name="_form_loaded"]');
    if (tf && (Date.now() - parseInt(tf.value, 10)) < 3000) return true;
    return false;
  },
  rateLimited: function(key) {
    try {
      const storageKey = 'elrisa_rl_' + key;
      const last = parseInt(localStorage.getItem(storageKey) || '0', 10);
      if (last && Date.now() - last < 30000) return true;
      localStorage.setItem(storageKey, Date.now().toString());
      return false;
    } catch(e) { return false; }
  }
};

document.addEventListener('DOMContentLoaded', () => {

  const GA_ID = 'G-TL9PKNVK70';

  // --- Google Analytics (consent-gated) ---
  function loadAnalytics() {
    if (document.getElementById('ga-script')) return;
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  // --- Cookie Consent Banner ---
  const COOKIE_KEY = 'elrisa_cookie_consent';

  function hasResponded() {
    try {
      const val = localStorage.getItem(COOKIE_KEY);
      return val === 'accepted' || val === 'rejected';
    } catch (e) {
      // localStorage blocked (file:// or private browsing)
      return false;
    }
  }

  // Load Analytics immediately if visitor already accepted
  try {
    if (localStorage.getItem(COOKIE_KEY) === 'accepted') loadAnalytics();
  } catch(e) {}

  function createCookieBanner() {
    if (hasResponded()) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-inner">
        <div class="cookie-text">
          <strong>We value your privacy</strong>
          <p>We use cookies to understand how visitors use our site (Google Analytics). Declining means no analytics data is collected. Read our <a href="${getBasePath()}pages/privacy.html">Privacy Policy</a> for full details.</p>
        </div>
        <div class="cookie-actions">
          <button id="cookie-reject" class="cookie-btn cookie-btn-outline">Decline</button>
          <button id="cookie-accept" class="cookie-btn cookie-btn-primary">Accept</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        banner.classList.add('visible');
      });
    });

    document.getElementById('cookie-accept').addEventListener('click', () => {
      try { localStorage.setItem(COOKIE_KEY, 'accepted'); } catch(e) {}
      loadAnalytics();
      closeBanner(banner);
    });

    document.getElementById('cookie-reject').addEventListener('click', () => {
      try { localStorage.setItem(COOKIE_KEY, 'rejected'); } catch(e) {}
      closeBanner(banner);
    });
  }

  function closeBanner(banner) {
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 400);
  }

  function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/pages/')) {
      return '../';
    }
    return '';
  }

  // Inject cookie banner styles
  const cookieStyles = document.createElement('style');
  cookieStyles.textContent = `
    #cookie-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10000;
      background: #0B1D26;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding: 14px 20px;
      transform: translateY(-100%);
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #cookie-banner.visible {
      transform: translateY(0);
    }
    .cookie-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .cookie-text {
      flex: 1;
      min-width: 280px;
    }
    .cookie-text strong {
      color: #FFFFFF;
      font-size: 0.95rem;
      display: block;
      margin-bottom: 4px;
    }
    .cookie-text p {
      color: rgba(255,255,255,0.6);
      font-size: 0.85rem;
      line-height: 1.6;
      margin: 0;
    }
    .cookie-text a {
      color: #10B981;
      text-decoration: underline;
    }
    .cookie-actions {
      display: flex;
      gap: 10px;
      flex-shrink: 0;
    }
    .cookie-btn {
      padding: 10px 24px;
      border-radius: 9999px;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }
    .cookie-btn-primary {
      background: #10B981;
      color: #FFFFFF;
    }
    .cookie-btn-primary:hover {
      background: #059669;
    }
    .cookie-btn-outline {
      background: transparent;
      color: rgba(255,255,255,0.7);
      border: 1.5px solid rgba(255,255,255,0.2);
    }
    .cookie-btn-outline:hover {
      border-color: rgba(255,255,255,0.5);
      color: #FFFFFF;
    }
    @media (max-width: 640px) {
      .cookie-inner { flex-direction: column; align-items: stretch; }
      .cookie-actions { justify-content: stretch; }
      .cookie-btn { flex: 1; text-align: center; }
    }
  `;
  document.head.appendChild(cookieStyles);

  createCookieBanner();


  // Inject honeypot + load-timestamp into every form on the page.
  // Form submit handlers call window.ElrisaForms.isSpam() to read these values.
  document.querySelectorAll('form').forEach(function(form) {
    if (!form.querySelector('[name="website_url"]')) {
      const hp = document.createElement('div');
      hp.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;height:0;width:0;overflow:hidden;pointer-events:none;';
      hp.setAttribute('aria-hidden', 'true');
      hp.innerHTML = '<label>Leave blank</label><input type="text" name="website_url" tabindex="-1" autocomplete="off">';
      form.insertBefore(hp, form.firstChild);
    }
    if (!form.querySelector('[name="_form_loaded"]')) {
      const tf = document.createElement('input');
      tf.type = 'hidden';
      tf.name = '_form_loaded';
      tf.value = Date.now().toString();
      form.appendChild(tf);
    }
  });


  // --- Lazy Loading Images ---
  const images = document.querySelectorAll('img[data-src]');
  if (images.length > 0 && 'IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          imgObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    images.forEach(img => imgObserver.observe(img));
  }

});