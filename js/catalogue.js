/* ============================================
   ELRISA — Product catalogue pages (grade tabs, search, order / sample / consultation forms)
   Used by pages/polyols.html. Grades are read from the catalogue tables (data-grade, data-name, data-family, data-note).
   ============================================ */
(function () {
  var ACCESS_KEY = '617cb79b-b722-4b7e-9059-a83b3c17abaa';
  // Page settings: window.ELRISA_CATALOGUE = { product: 'Polyol', fromName: '…', key: 'polyol' }
  var CFG = window.ELRISA_CATALOGUE || {};
  var PRODUCT = CFG.product || 'Product';
  var FROM_NAME = CFG.fromName || 'Elrisa Website';
  var KEY = CFG.key || 'catalogue';
  var COUNTRIES = ['Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica',"Côte d'Ivoire",'Croatia','Cuba','Cyprus','Czechia','Democratic Republic of the Congo','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hong Kong','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','São Tomé and Príncipe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Türkiye','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  // ---- Grade list, read from the catalogue tables (one source of truth) ----
  var grades = [];
  var seen = {};
  document.querySelectorAll('#catalogue [data-grade][data-family]').forEach(function (r) {
    var code = r.getAttribute('data-grade');
    if (seen[code]) return;
    seen[code] = true;
    grades.push({ code: code, name: r.getAttribute('data-name') || code, family: r.getAttribute('data-family'), note: r.getAttribute('data-note') });
  });
  function gradeLabel(code) {
    var g = grades.filter(function (x) { return x.code === code; })[0];
    return g ? g.name + ' — ' + g.family + ' (' + g.note + ')' : code;
  }

  document.querySelectorAll('.grade-select').forEach(function (sel) {
    sel.appendChild(el('option', { value: '' }, sel.required ? 'Select a grade' : 'None'));
    var groups = {};
    grades.forEach(function (g) {
      if (!groups[g.family]) { groups[g.family] = el('optgroup', { label: g.family }); sel.appendChild(groups[g.family]); }
      groups[g.family].appendChild(el('option', { value: g.code }, g.name + ' — ' + g.note));
    });
    sel.appendChild(el('option', { value: 'help' }, 'Not sure — please recommend a product'));
  });
  document.querySelectorAll('.country-select').forEach(function (sel) {
    sel.appendChild(el('option', { value: '' }, 'Select country'));
    COUNTRIES.forEach(function (c) { sel.appendChild(el('option', { value: c }, c)); });
  });

  // ---- Extra order lines (5 more, revealed one at a time) ----
  var lines = document.getElementById('order-lines');
  var first = lines.querySelector('.line');
  var MAX_LINES = 6;
  for (var i = 2; i <= MAX_LINES; i++) {
    var row = first.cloneNode(true);
    row.hidden = true;
    row.querySelectorAll('[id]').forEach(function (n) {
      var id = n.id.replace(/-1$/, '-' + i);
      var lab = row.querySelector('label[for="' + n.id + '"]');
      if (lab) lab.setAttribute('for', id);
      n.id = id;
      n.name = n.name.replace(/-1$/, '-' + i);
      n.required = false;
    });
    lines.appendChild(row);
  }
  var addBtn = document.getElementById('add-line');
  function lineRows() { return Array.prototype.slice.call(lines.querySelectorAll('.line')); }
  function syncAdd() { addBtn.hidden = lineRows().every(function (r) { return !r.hidden; }); }
  function lineHasValue(r) { return r.querySelector('.grade-select').value || r.querySelector('input').value; }
  addBtn.addEventListener('click', function () {
    var next = lineRows().filter(function (r) { return r.hidden; })[0];
    if (next) { next.hidden = false; next.querySelector('select').focus(); }
    syncAdd();
  });
  lines.addEventListener('click', function (e) {
    var btn = e.target.closest('.line-remove');
    if (!btn) return;
    var r = btn.closest('.line');
    r.querySelector('.grade-select').value = '';
    r.querySelector('input').value = '';
    r.querySelector('.grade-select').dispatchEvent(new Event('change', { bubbles: true }));
    r.hidden = true;
    syncAdd();
  });
  function showFilledLines() {
    lineRows().forEach(function (r, n) { if (n === 0 || lineHasValue(r)) r.hidden = false; });
    syncAdd();
  }
  document.getElementById('order-form').addEventListener('elrisa:draft-restored', showFilledLines);
  document.getElementById('order-form').addEventListener('elrisa:draft-cleared', function () { lineRows().forEach(function (r, n) { r.hidden = n > 0; }); syncAdd(); });
  syncAdd();

  // ---- Optional-details boxes: reopen when saved answers are restored ----
  document.querySelectorAll('#order-form, #sample-form').forEach(function (form) {
    form.addEventListener('elrisa:draft-restored', function () {
      form.querySelectorAll('details.more').forEach(function (d) {
        var filled = Array.prototype.slice.call(d.querySelectorAll('input, textarea, select')).some(function (f) {
          return f.value && f.selectedIndex !== 0;
        });
        if (filled) d.open = true;
      });
    });
  });

  // ---- How to choose: two small tabs ----
  var miniTabs = Array.prototype.slice.call(document.querySelectorAll('.mini-tab'));
  function showMini(tab, focus) {
    miniTabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  miniTabs.forEach(function (t, n) {
    t.addEventListener('click', function () { showMini(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      showMini(miniTabs[(n + 1) % miniTabs.length], true);
    });
  });

  // ---- Pinned section bar: sit under the site header and highlight where you are ----
  var pageNav = document.querySelector('.page-nav');
  var navSlot = document.querySelector('.page-nav-slot');
  var siteNav = document.querySelector('.navbar');
  function placeNav() {
    var bottom = siteNav ? Math.max(0, Math.round(siteNav.getBoundingClientRect().bottom)) : 0;
    pageNav.style.setProperty('--nav-h', bottom + 'px');
    navSlot.style.height = pageNav.offsetHeight + 'px';
    pageNav.classList.toggle('is-pinned', navSlot.getBoundingClientRect().top <= bottom);
  }
  placeNav();
  window.addEventListener('scroll', placeNav, { passive: true });
  window.addEventListener('resize', placeNav);
  var navLinks = Array.prototype.slice.call(pageNav.querySelectorAll('a:not(.pn-cta)'));
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('is-active', on);
          if (on) revealInStrip(a);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });
  }

  // ---- Tabs ----
  var tabs = { order: document.getElementById('tab-order'), sample: document.getElementById('tab-sample') };
  function openTab(kind, focus) {
    Object.keys(tabs).forEach(function (k) {
      var on = k === kind;
      tabs[k].setAttribute('aria-selected', on ? 'true' : 'false');
      tabs[k].tabIndex = on ? 0 : -1;
      document.getElementById('panel-' + k).hidden = !on;
    });
    if (focus) tabs[kind].focus();
  }
  Object.keys(tabs).forEach(function (k) {
    tabs[k].addEventListener('click', function () { openTab(k); });
    tabs[k].addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); openTab(k === 'order' ? 'sample' : 'order', true); }
    });
  });
  document.querySelectorAll('[data-open]').forEach(function (a) {
    a.addEventListener('click', function () { openTab(a.getAttribute('data-open')); });
  });
  if (location.hash === '#sample') openTab('sample');

  // ---- "Sample" / "Order" buttons on each grade ----
  function pick(select, code) {
    select.value = code;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
  document.getElementById('catalogue').addEventListener('click', function (e) {
    var btn = e.target.closest('.act');
    if (!btn) return;
    var code = btn.getAttribute('data-grade');
    var kind = btn.getAttribute('data-act');
    openTab(kind);
    var target;
    if (kind === 'order') {
      var rows = lineRows();
      var row = rows.filter(function (r) { return r.querySelector('.grade-select').value === code; })[0] ||
                rows.filter(function (r) { return !r.hidden && !lineHasValue(r); })[0] ||
                rows.filter(function (r) { return r.hidden; })[0] || rows[rows.length - 1];
      row.hidden = false; syncAdd();
      pick(row.querySelector('.grade-select'), code);
      target = row.querySelector('input');
    } else {
      var sels = Array.prototype.slice.call(document.querySelectorAll('#sample-form .grade-select'));
      var sel = sels.filter(function (s) { return s.value === code; })[0] ||
                sels.filter(function (s) { return !s.value; })[0] || sels[sels.length - 1];
      pick(sel, code);
      target = sel;
    }
    document.getElementById('request').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () { target.focus({ preventScroll: true }); }, 600);
  });

  // ---- Family tabs: one family table at a time ----
  var famTabs = Array.prototype.slice.call(document.querySelectorAll('.fam-tab'));
  var families = Array.prototype.slice.call(document.querySelectorAll('#catalogue .family'));
  var activeFam = famTabs.length ? famTabs[0].getAttribute('data-fam') : null;
  // Bring a chip into view inside its sideways-scrolling strip without moving the page
  function revealInStrip(item) {
    var strip = item.parentNode;
    var left = item.offsetLeft - strip.offsetLeft;
    if (left < strip.scrollLeft || left + item.offsetWidth > strip.scrollLeft + strip.clientWidth) {
      strip.scrollLeft = left - 16;
    }
  }
  function showFamily(id, focusTab) {
    if (!document.getElementById(id)) return;
    activeFam = id;
    famTabs.forEach(function (t) {
      var on = t.getAttribute('data-fam') === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focusTab) t.focus({ preventScroll: true });
      if (on) revealInStrip(t);
    });
    families.forEach(function (f) { f.hidden = f.id !== id; });
  }
  famTabs.forEach(function (t, n) {
    t.addEventListener('click', function () { clearSearch(); showFamily(t.getAttribute('data-fam')); });
    t.addEventListener('keydown', function (e) {
      var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      showFamily(famTabs[(n + step + famTabs.length) % famTabs.length].getAttribute('data-fam'), true);
    });
  });
  // Open the right family for links like #flexible or #elripol-301
  function familyFromHash(hash) {
    var target = hash && hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    var fam = target && target.closest ? target.closest('#catalogue .family') : null;
    return fam ? fam.id : null;
  }
  function openFromHash(scroll) {
    var id = familyFromHash(location.hash);
    if (!id) return;
    clearSearch();
    showFamily(id);
    if (scroll) document.getElementById(location.hash.slice(1)).scrollIntoView({ block: 'center' });
  }
  document.querySelectorAll('[data-fam-link]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      clearSearch();
      showFamily(a.getAttribute('href').slice(1));
      document.getElementById('grades').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  window.addEventListener('hashchange', function () { openFromHash(true); });
  if (activeFam) showFamily(familyFromHash(location.hash) || activeFam);

  // ---- Grade search (looks through every family) ----
  var search = document.getElementById('grade-search');
  var empty = document.getElementById('finder-empty');
  var gradesSection = document.getElementById('grades');
  function clearSearch() {
    if (!search.value) return;
    search.value = '';
    search.dispatchEvent(new Event('input'));
  }
  search.addEventListener('input', function () {
    var q = search.value.trim().toLowerCase().replace(/^(elribond|elripol)\s*/, '');
    gradesSection.classList.toggle('is-searching', !!q);
    if (!q) {
      document.querySelectorAll('#catalogue tbody tr').forEach(function (r) { r.hidden = false; });
      empty.style.display = 'none';
      showFamily(activeFam);
      return;
    }
    var any = false;
    var byCode = /^\d+$/.test(q); // "114" means the grade code, not a number somewhere in the values
    function cellsText(r) {
      return Array.prototype.map.call(r.cells, function (c) { return c.textContent; }).join(' | ').toLowerCase();
    }
    document.querySelectorAll('#catalogue .family').forEach(function (fam) {
      var famText = fam.querySelector('.family-head').textContent.toLowerCase();
      var famMatch = !byCode && famText.indexOf(q) !== -1;
      var rows = fam.querySelectorAll('.grade-table:not(.particles) tbody tr');
      var shown = 0;
      if (rows.length) {
        rows.forEach(function (r) {
          var hit = byCode ? r.getAttribute('data-grade').indexOf(q) === 0 : (famMatch || cellsText(r).indexOf(q) !== -1);
          r.hidden = !hit;
          if (hit) shown++;
        });
      } else if (byCode) {
        shown = fam.querySelectorAll('[data-grade^="' + q + '"]').length;
      } else {
        shown = (famMatch || Array.prototype.some.call(fam.querySelectorAll('tr'), function (r) { return cellsText(r).indexOf(q) !== -1; })) ? 1 : 0;
      }
      fam.hidden = shown === 0;
      if (shown) any = true;
    });
    empty.style.display = any ? 'none' : 'block';
  });

  // ---- Sending ----
  function reference(kind) {
    var d = new Date();
    var ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    return ({ order: 'ORD-', sample: 'SMP-', consult: 'CON-' }[kind] || 'REQ-') + ymd + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  var SKIP = ['website_url', '_form_loaded', 'botcheck'];

  document.querySelectorAll('#order-form, #sample-form, #consult-form').forEach(function (form) {
    var kind = form.getAttribute('data-kind');
    var panel = form.closest('.req-panel');
    var done = panel.querySelector('.req-done');
    var errorEl = form.querySelector('.req-error');
    var submit = form.querySelector('.req-submit');
    var submitText = submit.textContent;

    function fail(msg, field) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
      if (field) {
        // Centre the field so it is clear of the site header and the pinned section bar
        field.focus({ preventScroll: true });
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    form.addEventListener('elrisa:human-verified', function () { errorEl.hidden = true; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorEl.hidden = true;

      var bad = Array.prototype.slice.call(form.querySelectorAll('[required]')).filter(function (f) { return !f.closest('[hidden]') && !f.value.trim(); })[0];
      if (bad) {
        var label = form.querySelector('label[for="' + bad.id + '"]');
        fail('Please fill in "' + (label ? label.firstChild.textContent.trim() : 'this field') + '".', bad);
        return;
      }
      var email = form.querySelector('input[type="email"]');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { fail('That email address doesn\'t look right — please check it.', email); return; }
      if (window.ElrisaForms && !window.ElrisaForms.isHuman(form)) {
        window.ElrisaForms.flagHuman(form);
        fail('Please click "I\'m human", then send again.');
        return;
      }
      var ref = reference(kind);
      if (window.ElrisaForms) {
        if (window.ElrisaForms.isSpam(form)) { showDone(ref); return; }
        if (window.ElrisaForms.rateLimited(KEY + '-' + kind)) { fail('Please wait 30 seconds before sending again.'); return; }
      }

      var data = new FormData();
      var companyField = form.querySelector('[name="Company"]');
      var who = (companyField && companyField.value.trim()) || form.querySelector('[name="Contact name"]').value.trim();
      var SUBJECTS = { order: PRODUCT + ' ORDER ', sample: PRODUCT + ' SAMPLE request ', consult: 'PU foam CONSULTATION request ' };
      data.append('access_key', ACCESS_KEY);
      data.append('subject', SUBJECTS[kind] + ref + ' — ' + who);
      data.append('from_name', FROM_NAME);
      data.append('botcheck', '');
      data.append('replyto', email.value.trim());
      data.append('Reference', ref);

      if (kind === 'order') {
        var items = [];
        lineRows().forEach(function (r) {
          var g = r.querySelector('.grade-select').value;
          var q = r.querySelector('input').value;
          if (!g && !q) return;
          items.push((g === 'help' ? 'Grade to be recommended' : gradeLabel(g)) + ' — ' + (q || '?') + ' ' + r.querySelector('select:not(.grade-select)').value);
        });
        items.forEach(function (t, n) { data.append('Item ' + (n + 1), t); });
      } else if (kind === 'sample') {
        form.querySelectorAll('.grade-select').forEach(function (s, n) {
          if (s.value) data.append('Sample grade ' + (n + 1), s.value === 'help' ? 'Grade to be recommended' : gradeLabel(s.value));
        });
      }
      // Ticked boxes that share a name are sent as one comma-separated answer
      var answers = {};
      var fieldOrder = [];
      Array.prototype.slice.call(form.elements).forEach(function (f) {
        if (!f.name || SKIP.indexOf(f.name) !== -1 || f.type === 'button' || f.type === 'submit') return;
        if (f.classList.contains('grade-select') || /^ol-(qty|unit)-/.test(f.name)) return;
        if ((f.type === 'checkbox' || f.type === 'radio') && !f.checked) return;
        var v = (f.value || '').trim();
        if (!v) return;
        if (!answers[f.name]) { answers[f.name] = []; fieldOrder.push(f.name); }
        answers[f.name].push(v);
      });
      fieldOrder.forEach(function (n) { data.append(n, answers[n].join(', ')); });
      data.append('Submitted from', location.href.split('#')[0]);

      submit.disabled = true;
      submit.textContent = 'Sending…';
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.success) throw new Error(res.message || 'Send failed');
          showDone(ref);
        })
        .catch(function () {
          fail('We couldn\'t send your request just now. Check your connection and try again, or call us on +233 55 639 5946.');
        })
        .then(function () { submit.disabled = false; submit.textContent = submitText; });
    });

    function showDone(ref) {
      if (window.elrisaDraft) window.elrisaDraft.clear(form);
      if (window.ElrisaForms) window.ElrisaForms.resetHuman(form);
      form.hidden = true;
      done.querySelector('.ref').textContent = ref;
      done.hidden = false;
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      done.querySelector('h3').focus({ preventScroll: true });
    }

    done.querySelector('.req-again').addEventListener('click', function () {
      if (window.elrisaDraft) window.elrisaDraft.clear(form, true);
      done.hidden = true;
      form.hidden = false;
      form.querySelector('select, input').focus();
    });
  });
})();
  
