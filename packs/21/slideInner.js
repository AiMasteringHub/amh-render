// Signature Property Styling - bespoke slide markup. Canvas 1080 x 1350.
// Style 10 descent: cream palette, serif type, hairline rules, arched frames.
//
// tpl flags: bg ('cream'|'photo-panel'|'arch'|'dark'|'framed-photo')
//            dominant ('headline'|'quote')
//
// v2: the 'cream' background (used by Serif Editorial and Editorial Quote)
// now paints the slide's own photo full-bleed under a cream-tinted wash
// when opts.imageUrl is set, same as photo-panel/arch/framed-photo already
// did. No photo => the original solid cream card, unchanged. 'dark'
// (Dark Inversion) is untouched and still never takes a photo.

function esc(t) {
  return String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function hSize(text, cover) {
  var len = String(text || '').length;
  if (cover) {
    if (len > 120) return '38px';
    if (len > 80)  return '46px';
    if (len > 50)  return '54px';
    return '62px';
  }
  if (len > 150) return '36px';
  if (len > 110) return '40px';
  if (len > 70)  return '46px';
  return '52px';
}

function aSize(text) {
  var len = String(text || '').length;
  if (len > 200) return '26px';
  if (len > 120) return '30px';
  if (len > 60)  return '34px';
  return '38px';
}

function arrow(col) {
  return '<svg width="28" height="28" viewBox="0 0 28 28" fill="none">'
    + '<path d="M7 14h12M15 9l4 5-4 5" stroke="' + col
    + '" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function slideInner(s, i, post, tpl, n, opts, theme) {
  const isCover = i === 0;
  const isPunch = !s.main && !!s.accent;
  const isCta   = !!s.cta;
  const isLast  = i === n - 1;
  const bg  = tpl.bg || 'cream';
  const dom = tpl.dominant || 'headline';

  const cream = theme.ACCENT     || '#EBE9E2';
  const dark  = theme.DARK       || '#272624';
  const sec   = theme.SECONDARY  || '#8D8A87';
  const ink   = theme.INK        || dark;
  const aRgb  = theme.ACCENT_RGB || [235, 233, 226];
  // Primary font = headings. Secondary font = text below the heading, CTA and footer.
  // Secondary falls back to the primary font when the brand kit has none.
  const font     = theme.FONT_HEAD || theme.FONT || "'Georgia','Times New Roman',serif";
  const fontBody = theme.FONT_BODY || font;

  const isDark = bg === 'dark' || bg === 'framed-photo';
  const tc  = isDark ? cream : ink;
  const sc  = isDark ? 'rgba(' + aRgb[0] + ',' + aRgb[1] + ',' + aRgb[2] + ',0.6)' : sec;
  const rc  = isDark ? 'rgba(' + aRgb[0] + ',' + aRgb[1] + ',' + aRgb[2] + ',0.3)' : sec;

  var out = '';

  if (bg === 'cream') {
    if (opts.imageUrl) {
      out += '<div data-photo="1" style="position:absolute;inset:0;'
        + 'background:url(' + opts.imageUrl + ') center/cover no-repeat;pointer-events:none"></div>'
        + '<div style="position:absolute;inset:0;background:rgba('
        + aRgb[0] + ',' + aRgb[1] + ',' + aRgb[2] + ',0.82);pointer-events:none"></div>';
    } else {
      out += '<div style="position:absolute;inset:0;background:' + cream
        + ';pointer-events:none"></div>';
    }

  } else if (bg === 'photo-panel') {
    if (opts.imageUrl) {
      out += '<div data-photo="1" style="position:absolute;top:0;left:0;right:0;height:810px;'
        + 'background:url(' + opts.imageUrl + ') center/cover no-repeat;pointer-events:none"></div>'
        + '<div style="position:absolute;top:0;left:0;right:0;height:810px;'
        + 'background:linear-gradient(to bottom,rgba(0,0,0,0.05),rgba(0,0,0,0.3));'
        + 'pointer-events:none"></div>';
    } else {
      out += '<div style="position:absolute;top:0;left:0;right:0;height:810px;background:'
        + dark + ';pointer-events:none"></div>';
    }
    out += '<div style="position:absolute;bottom:0;left:0;right:0;height:540px;background:'
      + cream + ';pointer-events:none"></div>';

  } else if (bg === 'arch') {
    out += '<div style="position:absolute;inset:0;background:' + cream
      + ';pointer-events:none"></div>';
    var aT = isCover ? 160 : 80, aW = 500, aH = 650, aR = 250;
    if (opts.imageUrl) {
      out += '<div data-photo="1" style="position:absolute;top:' + aT + 'px;left:50%;'
        + 'transform:translateX(-50%);width:' + aW + 'px;height:' + aH + 'px;'
        + 'border-radius:' + aR + 'px ' + aR + 'px 0 0;'
        + 'background:url(' + opts.imageUrl + ') center/cover no-repeat;'
        + 'overflow:hidden;pointer-events:none"></div>';
    } else {
      out += '<div style="position:absolute;top:' + aT + 'px;left:50%;'
        + 'transform:translateX(-50%);width:' + aW + 'px;height:' + aH + 'px;'
        + 'border-radius:' + aR + 'px ' + aR + 'px 0 0;'
        + 'border:1px solid ' + sec + ';pointer-events:none"></div>';
    }

  } else if (bg === 'dark') {
    out += '<div style="position:absolute;inset:0;background:' + dark
      + ';pointer-events:none"></div>';

  } else if (bg === 'framed-photo') {
    if (opts.imageUrl) {
      out += '<div data-photo="1" style="position:absolute;inset:0;'
        + 'background:url(' + opts.imageUrl + ') center/cover no-repeat;'
        + 'pointer-events:none"></div>'
        + '<div style="position:absolute;inset:0;'
        + 'background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.1) 50%,'
        + 'rgba(0,0,0,0.05) 100%);pointer-events:none"></div>';
    } else {
      out += '<div style="position:absolute;inset:0;background:' + dark
        + ';pointer-events:none"></div>';
    }
    out += '<div style="position:absolute;inset:60px;border:1px solid rgba('
      + aRgb[0] + ',' + aRgb[1] + ',' + aRgb[2] + ',0.5);'
      + 'border-radius:4px;pointer-events:none"></div>';
  }

  if (isCover) {
    var onDark = bg === 'photo-panel' || bg === 'framed-photo' || bg === 'dark';
    var lc = onDark ? '#FFFFFF' : ink;

    if (opts.logoUrl) {
      var lt = bg === 'arch' ? '36px' : (bg === 'cream' ? '100px' : '80px');
      out += '<div style="position:absolute;top:' + lt + ';left:0;right:0;'
        + 'display:flex;justify-content:center;z-index:2;pointer-events:none">'
        + '<img src="' + opts.logoUrl + '" style="height:110px;object-fit:contain" />'
        + '</div>';
    } else {
      var nt = bg === 'arch' ? '50px' : (bg === 'cream' ? '120px' : '90px');
      out += '<div style="position:absolute;top:' + nt + ';left:80px;right:80px;'
        + 'text-align:center;z-index:2">'
        + '<span style="font-family:' + font + ';font-size:20px;letter-spacing:0.22em;'
        + 'text-transform:uppercase;color:' + lc + '">' + esc(theme.NAME) + '</span>'
        + '</div>';
    }
  }

  if (dom === 'quote') {
    out += '<div style="position:absolute;top:160px;left:50%;transform:translateX(-50%);'
      + 'font-family:' + font + ';font-size:260px;line-height:1;color:' + sec
      + ';opacity:0.18;pointer-events:none">&ldquo;</div>';

    var qt = s.accent || s.main || '';
    out += '<div style="position:absolute;top:320px;left:120px;right:120px;bottom:280px;'
      + 'display:flex;align-items:center;justify-content:center">'
      + '<div style="text-align:center">'
      + '<div style="width:80px;height:1px;background:' + rc + ';margin:0 auto 28px"></div>'
      + '<p style="font-family:' + font + ';font-style:italic;font-size:' + aSize(qt)
      + ';line-height:1.55;color:' + tc + ';margin:0">' + esc(qt) + '</p>'
      + '<div style="width:80px;height:1px;background:' + rc + ';margin:28px auto 0"></div>';

    if (s.cta) {
      out += '<p style="font-family:' + fontBody + ';font-size:16px;letter-spacing:0.18em;'
        + 'text-transform:uppercase;color:' + sc + ';margin:28px 0 0">'
        + esc(s.cta) + '</p>';
    }
    out += '</div></div>';

  } else {

    var tt, tb;
    if (bg === 'cream' || bg === 'dark') {
      tt = isCover ? '300px' : '180px'; tb = '180px';
    } else if (bg === 'photo-panel') {
      tt = '830px'; tb = '70px';
    } else if (bg === 'arch') {
      tt = isCover ? '840px' : '770px'; tb = '70px';
    } else if (bg === 'framed-photo') {
      tt = '700px'; tb = '100px';
    } else {
      tt = '200px'; tb = '180px';
    }

    out += '<div style="position:absolute;top:' + tt + ';left:100px;right:100px;bottom:' + tb
      + ';display:flex;flex-direction:column;align-items:center;justify-content:center;'
      + 'text-align:center">';

    if (isPunch) {
      out += '<p style="font-family:' + font + ';font-style:italic;font-size:'
        + hSize(s.accent, false) + ';line-height:1.35;color:' + tc
        + ';margin:0">' + esc(s.accent) + '</p>';

    } else if (isCta) {
      if (s.main) {
        out += '<p style="font-family:' + font + ';font-size:' + hSize(s.main, false)
          + ';line-height:1.3;letter-spacing:0.04em;text-transform:uppercase;color:' + tc
          + ';margin:0 0 24px">' + esc(s.main) + '</p>';
      }
      out += '<div style="width:100px;height:1px;background:' + rc
        + ';margin:0 auto 24px"></div>'
        + '<p style="font-family:' + fontBody + ';font-size:20px;letter-spacing:0.18em;'
        + 'text-transform:uppercase;color:' + tc + ';margin:0">'
        + esc(s.cta) + '</p>';

    } else {
      out += '<div style="width:120px;height:1px;background:' + rc
        + ';margin:0 auto 28px"></div>'
        + '<p style="font-family:' + font + ';font-size:' + hSize(s.main, isCover)
        + ';line-height:1.25;letter-spacing:0.05em;text-transform:uppercase;color:' + tc
        + ';margin:0">' + esc(s.main) + '</p>';

      if (s.accent) {
        out += '<div style="width:60px;height:1px;background:' + rc
          + ';margin:24px auto"></div>'
          + '<p style="font-family:' + fontBody + ';font-style:italic;font-size:'
          + aSize(s.accent) + ';line-height:1.5;color:' + sc
          + ';margin:0">' + esc(s.accent) + '</p>';
      }
    }

    out += '</div>';
  }

  if (!isLast && !isCover) {
    out += '<div style="position:absolute;bottom:52px;right:80px;pointer-events:none">'
      + arrow(isDark ? cream : ink) + '</div>';
  }

  if (!isCover) {
    var fc = isDark
      ? 'rgba(' + aRgb[0] + ',' + aRgb[1] + ',' + aRgb[2] + ',0.4)'
      : sec;
    out += '<div style="position:absolute;bottom:52px;left:80px;font-family:' + fontBody
      + ';font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:' + fc
      + '">' + esc(theme.FOOTER || theme.NAME) + '</div>';
  }

  return out;
}

module.exports = { slideInner };
