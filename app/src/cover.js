/* Sunset Cover Studio — cover renderer.
   Draws a multi-panel GTA-style poster cover on any canvas:
   neon-sunset sky, striped sun, palm silhouettes, angled photo panels
   with a colour grade, and big bold condensed caption lettering.
   Pure canvas 2D, no network, no fonts beyond system families. */

(function () {
  'use strict';

  var SIZES = {
    square: { label: 'Square', w: 1080, h: 1080 },
    portrait: { label: 'Portrait', w: 1080, h: 1350 },
    wide: { label: 'Wide', w: 1920, h: 1080 }
  };

  var GRADES = {
    sunset: {
      label: 'Sunset',
      sky: ['#1c0b33', '#7b2d8b', '#e6496f', '#ff7a3d', '#ffc46b'],
      sun: ['#fff3a3', '#ffb347', '#ff5e62'],
      slit: '#3a1550',
      wash: ['rgba(255,110,60,0.28)', 'rgba(255,46,99,0.18)'],
      tint: 'rgba(255,120,80,0.10)',
      palm: '#160a24',
      caption: ['#ffffff', '#ffe259', '#ff9a3d']
    },
    neon: {
      label: 'Neon Night',
      sky: ['#030014', '#1b0b4d', '#5b1a8a', '#c2188b', '#00e5ff'],
      sun: ['#e8fbff', '#7df9ff', '#ff2fb3'],
      slit: '#12063a',
      wash: ['rgba(0,229,255,0.22)', 'rgba(255,47,179,0.20)'],
      tint: 'rgba(80,40,255,0.10)',
      palm: '#05010f',
      caption: ['#ffffff', '#7df9ff', '#ff2fb3']
    },
    dusk: {
      label: 'Palm Dusk',
      sky: ['#08131a', '#12333d', '#1f6f6b', '#e08a3c', '#f5c86b'],
      sun: ['#fff8d6', '#ffd166', '#ef8354'],
      slit: '#0f2a33',
      wash: ['rgba(32,160,140,0.20)', 'rgba(245,180,90,0.18)'],
      tint: 'rgba(20,120,110,0.10)',
      palm: '#071318',
      caption: ['#ffffff', '#ffe9a8', '#ef8354']
    }
  };

  /* Layouts return panels as normalised polygons (0..1) plus the caption band. */
  function layoutPanels(name) {
    if (name === 'diagonal') {
      return [
        { pts: [[0.03, 0.03], [0.38, 0.03], [0.30, 0.66], [0.03, 0.66]] },
        { pts: [[0.41, 0.03], [0.70, 0.03], [0.62, 0.66], [0.33, 0.66]] },
        { pts: [[0.73, 0.03], [0.97, 0.03], [0.97, 0.66], [0.65, 0.66]] }
      ];
    }
    if (name === 'grid') {
      return [
        { pts: [[0.03, 0.03], [0.65, 0.03], [0.65, 0.43], [0.03, 0.43]] },
        { pts: [[0.68, 0.03], [0.97, 0.03], [0.97, 0.43], [0.68, 0.43]] },
        { pts: [[0.03, 0.46], [0.32, 0.46], [0.32, 0.66], [0.03, 0.66]] },
        { pts: [[0.35, 0.46], [0.97, 0.46], [0.97, 0.66], [0.35, 0.66]] }
      ];
    }
    /* hero (default): one big panel, two stacked small ones. */
    return [
      { pts: [[0.03, 0.03], [0.65, 0.03], [0.65, 0.66], [0.03, 0.66]] },
      { pts: [[0.68, 0.03], [0.97, 0.03], [0.97, 0.33], [0.68, 0.33]] },
      { pts: [[0.68, 0.36], [0.97, 0.36], [0.97, 0.66], [0.68, 0.66]] }
    ];
  }

  function panelBox(pts, w, h) {
    var xs = pts.map(function (p) { return p[0] * w; });
    var ys = pts.map(function (p) { return p[1] * h; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  function tracePoly(ctx, pts, w, h) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
    ctx.closePath();
  }

  function drawStripedSun(ctx, grade, w, h) {
    /* The sun sits low in the caption band, right of the lettering, so it
       stays visible instead of hiding behind the photo panels. */
    var cx = w * 0.88, cy = h * 0.815, r = Math.min(w, h) * 0.085;
    var g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    g.addColorStop(0, grade.sun[0]);
    g.addColorStop(0.55, grade.sun[1]);
    g.addColorStop(1, grade.sun[2]);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    /* Synthwave slits across the lower half of the sun. */
    ctx.fillStyle = grade.slit;
    var y = cy + r * 0.05, thick = r * 0.045;
    while (y < cy + r) {
      ctx.fillRect(cx - r, y, r * 2, thick);
      y += thick * 2.4;
      thick *= 1.35;
    }
    ctx.restore();
  }

  function drawPalm(ctx, x, y, s, lean, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    ctx.scale(s, s);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    /* Trunk. */
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(6, -52, -2, -96);
    ctx.stroke();
    /* Fronds fanning from the crown. */
    ctx.lineWidth = 5;
    var angles = [-160, -125, -95, -65, -30, -5, 25];
    for (var i = 0; i < angles.length; i++) {
      var a = angles[i] * Math.PI / 180;
      var tx = -2 + Math.cos(a) * 62, ty = -96 + Math.sin(a) * 42;
      var mx = -2 + Math.cos(a) * 34, my = -96 + Math.sin(a) * 14 - 16;
      ctx.beginPath();
      ctx.moveTo(-2, -96);
      ctx.quadraticCurveTo(mx, my, tx, ty);
      ctx.stroke();
    }
    /* Coconuts. */
    ctx.beginPath(); ctx.arc(3, -90, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-6, -88, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawPhotoInPanel(ctx, img, panel, box, w, h, grade) {
    if (!img || !img.naturalWidth) {
      ctx.fillStyle = '#241533';
      ctx.fillRect(box.x, box.y, box.w, box.h);
      return;
    }
    var z = panel.zoom || 1;
    var scale = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight) * z;
    var dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    var dx = box.x + (box.w - dw) / 2 + (panel.ox || 0) * box.w;
    var dy = box.y + (box.h - dh) / 2 + (panel.oy || 0) * box.h;
    ctx.drawImage(img, dx, dy, dw, dh);
    /* Colour grade wash over the photo. */
    var wash = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
    wash.addColorStop(0, grade.wash[0]);
    wash.addColorStop(1, grade.wash[1]);
    ctx.fillStyle = wash;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = grade.tint;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }

  function fitCaptionFont(ctx, text, maxWidth, startSize) {
    var size = startSize;
    ctx.font = '900 ' + size + 'px "Arial Narrow", "Helvetica Neue", Impact, sans-serif';
    try { ctx.letterSpacing = '1px'; } catch (e) { /* older canvas: ignore */ }
    while (size > 24 && ctx.measureText(text).width > maxWidth) {
      size -= 4;
      ctx.font = '900 ' + size + 'px "Arial Narrow", "Helvetica Neue", Impact, sans-serif';
    }
    return size;
  }

  function drawCaption(ctx, state, grade, w, h) {
    var bandY = h * 0.70, bandH = h * 0.27;
    var caption = (state.caption || 'SUNSET HEIST').toUpperCase();
    var sub = (state.subcaption || '').trim();
    ctx.save();
    ctx.translate(w / 2, bandY + bandH * 0.42);
    ctx.rotate(-0.022);
    var size = fitCaptionFont(ctx, caption, w * 0.92, Math.round(h * 0.115));
    var grad = ctx.createLinearGradient(0, -size * 0.6, 0, size * 0.6);
    grad.addColorStop(0, grade.caption[0]);
    grad.addColorStop(0.55, grade.caption[1]);
    grad.addColorStop(1, grade.caption[2]);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(10,0,20,0.55)';
    ctx.shadowBlur = Math.max(6, h * 0.012);
    ctx.shadowOffsetY = Math.max(3, h * 0.006);
    ctx.strokeStyle = '#14001f';
    ctx.lineWidth = Math.max(4, size * 0.09);
    ctx.strokeText(caption, 0, 0);
    ctx.fillStyle = grad;
    ctx.fillText(caption, 0, 0);
    ctx.restore();

    if (sub) {
      ctx.save();
      ctx.translate(w / 2, bandY + bandH * 0.82);
      ctx.rotate(-0.022);
      var subSize = Math.max(14, Math.round(h * 0.026));
      ctx.font = '700 ' + subSize + 'px "Arial Narrow", Arial, sans-serif';
      try { ctx.letterSpacing = '4px'; } catch (e) { /* ignore */ }
      var tw = ctx.measureText(sub.toUpperCase()).width;
      var pad = subSize * 0.9;
      ctx.fillStyle = 'rgba(12,0,24,0.72)';
      roundRect(ctx, -tw / 2 - pad, -subSize * 0.95, tw + pad * 2, subSize * 1.9, subSize * 0.95);
      ctx.fill();
      ctx.fillStyle = '#ffe9c9';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sub.toUpperCase(), 0, subSize * 0.05);
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCover(canvas, state, sizeKey) {
    var size = SIZES[sizeKey || state.size || 'wide'];
    var w = size.w, h = size.h;
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    var grade = GRADES[state.grade || 'sunset'];
    var panels = layoutPanels(state.layout || 'hero');

    /* Sky. */
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    grade.sky.forEach(function (c, i) {
      sky.addColorStop(i / (grade.sky.length - 1), c);
    });
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    drawStripedSun(ctx, grade, w, h);

    /* Palms in the lower corners, behind the caption band. */
    var ps = Math.min(w, h) / 720;
    drawPalm(ctx, w * 0.045, h * 0.985, ps * 1.15, 0.10, grade.palm);
    drawPalm(ctx, w * 0.955, h * 0.99, ps * 0.95, -0.12, grade.palm);

    /* Photo panels with white poster borders. */
    panels.forEach(function (def, i) {
      var p = state.panels[i] || {};
      var box = panelBox(def.pts, w, h);
      ctx.save();
      tracePoly(ctx, def.pts, w, h);
      ctx.clip();
      /* Slight bleed so the clip never shows sky at the edges. */
      drawPhotoInPanel(ctx, p.img || null, p, {
        x: box.x - 2, y: box.y - 2, w: box.w + 4, h: box.h + 4
      }, w, h, grade);
      ctx.restore();
      ctx.save();
      ctx.shadowColor = 'rgba(5,0,15,0.5)';
      ctx.shadowBlur = Math.max(8, w * 0.008);
      ctx.shadowOffsetY = Math.max(4, h * 0.005);
      tracePoly(ctx, def.pts, w, h);
      ctx.strokeStyle = '#fff8ef';
      ctx.lineWidth = Math.max(3, w * 0.004);
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
      if (state.selected === i) {
        ctx.save();
        tracePoly(ctx, def.pts, w, h);
        ctx.strokeStyle = '#ffe259';
        ctx.lineWidth = Math.max(3, w * 0.003);
        ctx.setLineDash([Math.max(10, w * 0.012), Math.max(8, w * 0.008)]);
        ctx.stroke();
        ctx.restore();
      }
    });

    drawCaption(ctx, state, grade, w, h);

    /* Vignette. */
    var vig = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.45,
      w / 2, h / 2, Math.max(w, h) * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(8,0,18,0.38)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
    return { w: w, h: h };
  }

  window.CoverArt = {
    SIZES: SIZES,
    GRADES: GRADES,
    layoutPanels: layoutPanels,
    panelBox: panelBox,
    drawCover: drawCover
  };
})();
