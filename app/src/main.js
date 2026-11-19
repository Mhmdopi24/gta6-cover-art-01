/* Sunset Cover Studio — editor wiring.
   State, photo loading (FileReader, never uploaded), panel selection,
   drag-to-position, sliders, layout / grade / size controls, PNG export,
   and the ?shot= modes used for screenshots. */

(function () {
  'use strict';

  var SAMPLES = [
    { key: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' },
    { key: 'pier', label: 'Pier', src: 'samples/pier.jpg' }
  ];

  var state = {
    caption: 'SUNSET HEIST',
    subcaption: 'NEON STREETS • SUMMER 2026',
    layout: 'hero',
    grade: 'sunset',
    size: 'wide',
    selected: 0,
    panels: [] /* { src, img, zoom, ox, oy } */
  };

  var canvas, statusEl;
  var dragging = null;

  function $(id) { return document.getElementById(id); }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('could not load image')); };
      img.src = src;
    });
  }

  function panelCount() {
    return window.CoverArt.layoutPanels(state.layout).length;
  }

  function ensurePanels() {
    var n = panelCount();
    while (state.panels.length < n) {
      state.panels.push({ src: null, img: null, zoom: 1, ox: 0, oy: 0 });
    }
    state.panels.length = n;
    if (state.selected >= n) state.selected = 0;
  }

  function render() {
    ensurePanels();
    var size = window.CoverArt.SIZES[state.size];
    /* Preview canvas draws at half resolution for speed; export is full size. */
    var preview = document.createElement('canvas');
    window.CoverArt.drawCover(preview, state, state.size);
    canvas.width = preview.width;
    canvas.height = preview.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(preview, 0, 0);
    canvas.style.aspectRatio = size.w + ' / ' + size.h;
    window.__coverReady = true;
  }

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function refreshPanelButtons() {
    var wrap = $('panelButtons');
    wrap.innerHTML = '';
    for (var i = 0; i < panelCount(); i++) {
      (function (idx) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip' + (state.selected === idx ? ' active' : '');
        b.textContent = 'Panel ' + (idx + 1);
        b.addEventListener('click', function () {
          state.selected = idx;
          syncControls();
          render();
        });
        wrap.appendChild(b);
      })(i);
    }
    var p = state.panels[state.selected] || { zoom: 1, ox: 0, oy: 0 };
    $('zoomSlider').value = p.zoom || 1;
    $('zoomVal').textContent = Math.round((p.zoom || 1) * 100) + '%';
    $('xSlider').value = p.ox || 0;
    $('ySlider').value = p.oy || 0;
  }

  function syncControls() {
    refreshPanelButtons();
    document.querySelectorAll('[data-layout]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.layout === state.layout);
    });
    document.querySelectorAll('[data-grade]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.grade === state.grade);
    });
    document.querySelectorAll('[data-size]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.size === state.size);
    });
    $('captionInput').value = state.caption;
    $('subInput').value = state.subcaption;
  }

  function assignPhotoToPanel(img, src, idx) {
    var p = state.panels[idx];
    p.img = img;
    p.src = src;
    p.zoom = 1; p.ox = 0; p.oy = 0;
    render();
  }

  function fillAllPanels(img, src) {
    state.panels.forEach(function (p) {
      p.img = img; p.src = src; p.zoom = 1; p.ox = 0; p.oy = 0;
    });
    render();
  }

  function exportPNG() {
    var size = window.CoverArt.SIZES[state.size];
    var off = document.createElement('canvas');
    var savedSelected = state.selected;
    state.selected = -1; /* no selection dashes on the exported cover */
    window.CoverArt.drawCover(off, state, state.size);
    state.selected = savedSelected;
    render();
    off.toBlob(function (blob) {
      if (!blob) { setStatus('Export failed — try again.'); return; }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cover-' + size.w + 'x' + size.h + '.png';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 1000);
      setStatus('Exported PNG ' + size.w + ' x ' + size.h + ' — check your downloads.');
    }, 'image/png');
  }

  /* Click a panel in the preview to select it; drag to move its photo. */
  function canvasPoint(evt) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - r.left) / r.width,
      y: (evt.clientY - r.top) / r.height
    };
  }

  function panelAt(nx, ny) {
    var size = window.CoverArt.SIZES[state.size];
    var defs = window.CoverArt.layoutPanels(state.layout);
    for (var i = defs.length - 1; i >= 0; i--) {
      var box = window.CoverArt.panelBox(defs[i].pts, size.w, size.h);
      if (nx * size.w >= box.x && nx * size.w <= box.x + box.w &&
          ny * size.h >= box.y && ny * size.h <= box.y + box.h) return i;
    }
    return -1;
  }

  function bindCanvas() {
    canvas.addEventListener('pointerdown', function (evt) {
      var pt = canvasPoint(evt);
      var idx = panelAt(pt.x, pt.y);
      if (idx < 0) return;
      state.selected = idx;
      var p = state.panels[idx];
      dragging = { idx: idx, startX: pt.x, startY: pt.y, ox: p.ox || 0, oy: p.oy || 0 };
      canvas.setPointerCapture(evt.pointerId);
      syncControls();
      render();
    });
    canvas.addEventListener('pointermove', function (evt) {
      if (!dragging) return;
      var pt = canvasPoint(evt);
      var p = state.panels[dragging.idx];
      p.ox = dragging.ox + (pt.x - dragging.startX);
      p.oy = dragging.oy + (pt.y - dragging.startY);
      p.ox = Math.max(-0.6, Math.min(0.6, p.ox));
      p.oy = Math.max(-0.6, Math.min(0.6, p.oy));
      render();
    });
    canvas.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = null;
      var p = state.panels[state.selected];
      $('xSlider').value = p.ox || 0;
      $('ySlider').value = p.oy || 0;
    });
  }

  function bindControls() {
    $('photoInput').addEventListener('change', function (evt) {
      var files = Array.prototype.slice.call(evt.target.files || []);
      if (!files.length) return;
      var readers = files.map(function (f) {
        return new Promise(function (resolve, reject) {
          var r = new FileReader();
          r.onload = function () { resolve(r.result); };
          r.onerror = reject;
          r.readAsDataURL(f);
        });
      });
      Promise.all(readers).then(function (urls) {
        var loads = urls.map(loadImage);
        return Promise.all(loads).then(function (imgs) {
          return imgs.map(function (img, i) { return { img: img, src: urls[i] }; });
        });
      }).then(function (photos) {
        /* First photo goes to the selected panel; extras fill the next panels. */
        photos.forEach(function (ph, k) {
          var idx = Math.min(state.selected + k, panelCount() - 1);
          assignPhotoToPanel(ph.img, ph.src, idx);
        });
        setStatus(photos.length + ' photo(s) loaded — drag inside a panel to position it.');
      }).catch(function () {
        setStatus('That file could not be read as an image.');
      });
      evt.target.value = '';
    });

    SAMPLES.forEach(function (s) {
      $('sample-' + s.key).addEventListener('click', function () {
        loadImage(s.src).then(function (img) {
          assignPhotoToPanel(img, s.src, state.selected);
          setStatus('Sample "' + s.label + '" in Panel ' + (state.selected + 1) + '.');
        });
      });
    });
    $('fillAllSamples').addEventListener('click', function () {
      loadImage(SAMPLES[state.selected % SAMPLES.length].src).then(function (img) {
        fillAllPanels(img, SAMPLES[state.selected % SAMPLES.length].src);
        setStatus('One photo now fills every panel.');
      });
    });
    $('fillBoth').addEventListener('click', function () {
      Promise.all(SAMPLES.map(function (s) { return loadImage(s.src); })).then(function (imgs) {
        state.panels.forEach(function (p, i) {
          p.img = imgs[i % imgs.length];
          p.src = SAMPLES[i % SAMPLES.length].src;
          p.zoom = 1; p.ox = 0; p.oy = 0;
        });
        render();
        setStatus('Both samples loaded across the panels.');
      });
    });

    $('zoomSlider').addEventListener('input', function (evt) {
      var p = state.panels[state.selected];
      p.zoom = parseFloat(evt.target.value);
      $('zoomVal').textContent = Math.round(p.zoom * 100) + '%';
      render();
    });
    $('xSlider').addEventListener('input', function (evt) {
      state.panels[state.selected].ox = parseFloat(evt.target.value);
      render();
    });
    $('ySlider').addEventListener('input', function (evt) {
      state.panels[state.selected].oy = parseFloat(evt.target.value);
      render();
    });

    document.querySelectorAll('[data-layout]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.layout = b.dataset.layout;
        ensurePanels();
        syncControls();
        render();
      });
    });
    document.querySelectorAll('[data-grade]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.grade = b.dataset.grade;
        syncControls();
        render();
      });
    });
    document.querySelectorAll('[data-size]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.size = b.dataset.size;
        syncControls();
        render();
      });
    });

    $('captionInput').addEventListener('input', function (evt) {
      state.caption = evt.target.value || 'SUNSET HEIST';
      render();
    });
    $('subInput').addEventListener('input', function (evt) {
      state.subcaption = evt.target.value;
      render();
    });
    $('exportBtn').addEventListener('click', exportPNG);
  }

  /* Screenshot modes: ?shot=cover|editor|square|portrait[&caption=...&grade=...&layout=...] */
  function applyShotParams() {
    var q = new URLSearchParams(window.location.search);
    var shot = q.get('shot');
    if (!shot) return null;
    if (q.get('caption')) state.caption = q.get('caption');
    if (q.get('sub')) state.subcaption = q.get('sub');
    if (q.get('grade') && window.CoverArt.GRADES[q.get('grade')]) state.grade = q.get('grade');
    if (q.get('layout')) state.layout = q.get('layout');
    if (shot === 'square') state.size = 'square';
    if (shot === 'portrait') state.size = 'portrait';
    if (shot === 'cover') state.size = 'wide';
    return shot;
  }

  function init() {
    canvas = $('coverCanvas');
    statusEl = $('statusLine');
    var shot = applyShotParams();
    ensurePanels();
    Promise.all(SAMPLES.map(function (s) { return loadImage(s.src); })).then(function (imgs) {
      state.panels.forEach(function (p, i) {
        p.img = imgs[i % imgs.length];
        p.src = SAMPLES[i % SAMPLES.length].src;
      });
      if (shot === 'cover' || shot === 'square' || shot === 'portrait') {
        document.body.classList.add('shot-cover');
        state.selected = -1;
      }
      syncControls();
      render();
      if (shot) window.__coverReady = true;
    }).catch(function () {
      setStatus('Samples could not load — upload a photo to start.');
      syncControls();
      render();
    });
    bindControls();
    bindCanvas();
    /* Export helper for automation / testing. */
    window.__exportPNG = exportPNG;
    window.__state = state;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
