/* ============================================
   ELRISA CHEMICALS — SEO, Cookies & Security
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Cookie Consent Banner ---
  const COOKIE_KEY = 'elrisa_cookie_consent';

  function hasConsented() {
    return localStorage.getItem(COOKIE_KEY) === 'accepted';
  }

  function createCookieBanner() {
    if (hasConsented()) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-inner">
        <div class="cookie-text">
          <strong>We value your privacy</strong>
          <p>We use cookies to enhance your browsing experience and analyse site traffic. By clicking "Accept", you consent to our use of cookies. Read our <a href="${getBasePath()}pages/privacy.html">Privacy Policy</a> for more information.</p>
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
      localStorage.setItem(COOKIE_KEY, 'accepted');
      closeBanner(banner);
    });

    document.getElementById('cookie-reject').addEventListener('click', () => {
      localStorage.setItem(COOKIE_KEY, 'rejected');
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
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 10000;
      background: #0B1D26;
      border-top: 1px solid rgba(255,255,255,0.1);
      padding: 20px;
      transform: translateY(100%);
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


  // --- Contact Form Honeypot Spam Protection ---
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    // Inject honeypot field (hidden from real users, bots fill it in)
    const honeypot = document.createElement('div');
    honeypot.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;height:0;width:0;overflow:hidden;';
    honeypot.setAttribute('aria-hidden', 'true');
    honeypot.innerHTML = `
      <label for="website_url">Leave this empty</label>
      <input type="text" id="website_url" name="website_url" tabindex="-1" autocomplete="off">
    `;
    contactForm.insertBefore(honeypot, contactForm.firstChild);

    // Add timestamp to detect instant submissions (bots submit immediately)
    const timeField = document.createElement('input');
    timeField.type = 'hidden';
    timeField.name = '_form_loaded';
    timeField.value = Date.now().toString();
    contactForm.appendChild(timeField);

    // Override form submit to check honeypot + timing
    const originalSubmit = contactForm.onsubmit;
    contactForm.onsubmit = function(e) {
      e.preventDefault();

      // Check honeypot
      const hpField = document.getElementById('website_url');
      if (hpField && hpField.value !== '') {
        // Bot detected — silently show success (don't reveal detection)
        const form = document.getElementById('contact-form');
        const success = document.getElementById('form-success');
        if (form && success) {
          form.style.display = 'none';
          success.style.display = 'block';
        }
        return false;
      }

      // Check timing (less than 3 seconds = likely bot)
      const loadTime = parseInt(timeField.value, 10);
      const elapsed = Date.now() - loadTime;
      if (elapsed < 3000) {
        const form = document.getElementById('contact-form');
        const success = document.getElementById('form-success');
        if (form && success) {
          form.style.display = 'none';
          success.style.display = 'block';
        }
        return false;
      }

      // Legitimate submission — call original handler
      if (typeof handleSubmit === 'function') {
        return handleSubmit(e);
      }
      return false;
    };
  }


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
