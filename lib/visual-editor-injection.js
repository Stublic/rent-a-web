/**
 * Visual Editor Injection Script — exported as a string constant.
 * Injected into the preview iframe to enable inline WYSIWYG editing.
 *
 * Messages FROM parent:
 *   - { type: 'enable-visual-edit' }
 *   - { type: 'disable-visual-edit' }
 *   - { type: 'get-clean-html' }
 *   - { type: 'image-uploaded', imgId, newSrc }
 *
 * Messages TO parent:
 *   - { type: 'image-upload-request', imgId }
 *   - { type: 'clean-html', html }
 *   - { type: 'visual-edit-change' }
 */

export const VISUAL_EDITOR_SCRIPT = `
(function () {
  if (window.__visualEditorActive !== undefined) return;
  window.__visualEditorActive = false;

  var EDITABLE_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, span, a, button, li, td, th, blockquote, label, figcaption';
  var STYLE_ID = '__visual-editor-style';
  var imgCounter = 0;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '[data-ve-editable]:hover { outline: 2px dashed rgba(59,130,246,0.5) !important; outline-offset: 2px !important; cursor: text !important; }',
      '[data-ve-editable]:focus { outline: 2px solid rgba(59,130,246,0.8) !important; outline-offset: 2px !important; }',
      '[data-ve-editable] { cursor: text !important; }',
      'img[data-ve-img] { cursor: pointer !important; transition: outline 0.15s ease; }',
      'img[data-ve-img]:hover { outline: 2px dashed rgba(234,88,12,0.6) !important; outline-offset: 2px !important; }',
      '[data-ve-bg] { cursor: pointer !important; position: relative; transition: outline 0.15s ease; }',
      '[data-ve-bg]:hover { outline: 2px dashed rgba(234,88,12,0.6) !important; outline-offset: 2px !important; }',
      '[data-ve-bg]::after { content: "\\\\1F4F7 Zamijeni sliku"; position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.75); color: #fff; font-size: 11px; padding: 4px 10px; border-radius: 6px; pointer-events: none; opacity: 0; transition: opacity 0.2s; z-index: 9999; font-family: sans-serif; }',
      '[data-ve-bg]:hover::after { opacity: 1; }',
      'a[data-ve-editable] { pointer-events: auto !important; }'
    ].join('\\\\n');
    document.head.appendChild(style);
  }

  function removeStyles() {
    var s = document.getElementById(STYLE_ID);
    if (s) s.remove();
  }

  function getBackgroundImageUrl(el) {
    var style = window.getComputedStyle(el);
    var bg = style.backgroundImage;
    if (!bg || bg === 'none') return null;
    var match = bg.match(/url\\\\(["']?([^"')]+)["']?\\\\)/);
    return match ? match[1] : null;
  }

  function enableEditMode() {
    window.__visualEditorActive = true;
    injectStyles();

    // Text elements
    document.querySelectorAll(EDITABLE_SELECTOR).forEach(function(el) {
      if (el.closest('[data-ve-editable]') && el.closest('[data-ve-editable]') !== el) return;
      if (el.closest('script, style, svg, noscript')) return;
      if (!el.textContent.trim()) return;
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('data-ve-editable', 'true');
      el.addEventListener('input', onContentChange);
    });

    // <img> elements
    document.querySelectorAll('img').forEach(function(img) {
      if (img.closest('script, style, svg, noscript')) return;
      var id = 've-img-' + (++imgCounter);
      img.setAttribute('data-ve-img', id);
      img.addEventListener('click', onImageClick);
      img.style.cursor = 'pointer';
    });

    // Elements with background-image (divs, sections, etc.)
    document.querySelectorAll('div, section, header, figure, article, aside, main').forEach(function(el) {
      if (el.closest('script, style, svg, noscript')) return;
      var bgUrl = getBackgroundImageUrl(el);
      if (!bgUrl) return;
      // Skip tiny elements (likely decorative)
      if (el.offsetWidth < 50 || el.offsetHeight < 50) return;
      var id = 've-bg-' + (++imgCounter);
      el.setAttribute('data-ve-bg', id);
      el.setAttribute('data-ve-bg-url', bgUrl);
      el.addEventListener('click', onBgImageClick);
    });

    document.addEventListener('click', linkInterceptor, true);
  }

  function disableEditMode() {
    window.__visualEditorActive = false;

    document.querySelectorAll('[data-ve-editable]').forEach(function(el) {
      el.removeAttribute('contenteditable');
      el.removeAttribute('data-ve-editable');
      el.removeEventListener('input', onContentChange);
    });

    document.querySelectorAll('[data-ve-img]').forEach(function(img) {
      img.removeAttribute('data-ve-img');
      img.removeEventListener('click', onImageClick);
      img.style.cursor = '';
    });

    document.querySelectorAll('[data-ve-bg]').forEach(function(el) {
      el.removeAttribute('data-ve-bg');
      el.removeAttribute('data-ve-bg-url');
      el.removeEventListener('click', onBgImageClick);
    });

    document.removeEventListener('click', linkInterceptor, true);
    removeStyles();
  }

  function linkInterceptor(e) {
    var anchor = e.target.closest ? e.target.closest('a') : null;
    if (anchor) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function onContentChange() {
    window.parent.postMessage({ type: 'visual-edit-change' }, '*');
  }

  function onImageClick(e) {
    e.preventDefault();
    e.stopPropagation();
    var img = e.currentTarget;
    var imgId = img.getAttribute('data-ve-img');
    if (!imgId) return;
    window.parent.postMessage({ type: 'image-upload-request', imgId: imgId }, '*');
  }

  function onBgImageClick(e) {
    // Only trigger if clicking the background element itself, not a child text element
    var target = e.target;
    if (target.getAttribute('data-ve-editable')) return;
    if (target.closest && target.closest('[data-ve-editable]')) return;
    e.preventDefault();
    e.stopPropagation();
    var el = e.currentTarget;
    var bgId = el.getAttribute('data-ve-bg');
    if (!bgId) return;
    window.parent.postMessage({ type: 'image-upload-request', imgId: bgId }, '*');
  }

  function getCleanHtml() {
    // Sync any JS-modified background-image to the style attribute before cloning
    document.querySelectorAll('[data-ve-bg]').forEach(function(el) {
      var newUrl = el.getAttribute('data-ve-bg-url');
      var origUrl = getBackgroundImageUrl(el);
      // If the URL was changed, ensure it's in the inline style
      if (newUrl && newUrl !== origUrl) {
        el.style.backgroundImage = 'url(' + newUrl + ')';
      }
    });

    var clone = document.documentElement.cloneNode(true);

    clone.querySelectorAll('[data-ve-editable]').forEach(function(el) {
      el.removeAttribute('contenteditable');
      el.removeAttribute('data-ve-editable');
    });

    clone.querySelectorAll('[data-ve-img]').forEach(function(img) {
      img.removeAttribute('data-ve-img');
      var st = (img.getAttribute('style') || '').replace(/cursor\\\\s*:\\\\s*[^;]*;?/gi, '').trim();
      if (st) img.setAttribute('style', st);
      else img.removeAttribute('style');
    });

    clone.querySelectorAll('[data-ve-bg]').forEach(function(el) {
      el.removeAttribute('data-ve-bg');
      el.removeAttribute('data-ve-bg-url');
    });

    var injectedStyle = clone.querySelector('#' + STYLE_ID);
    if (injectedStyle) injectedStyle.remove();

    clone.querySelectorAll('script[data-ve-script]').forEach(function(s) { s.remove(); });

    return '<!DOCTYPE html>\\\\n' + clone.outerHTML;
  }

  window.addEventListener('message', function(e) {
    if (!e.data || typeof e.data.type !== 'string') return;

    switch (e.data.type) {
      case 'enable-visual-edit':
        enableEditMode();
        break;
      case 'disable-visual-edit':
        disableEditMode();
        break;
      case 'get-clean-html':
        var html = getCleanHtml();
        window.parent.postMessage({ type: 'clean-html', html: html }, '*');
        break;
      case 'image-uploaded':
        var imgId = e.data.imgId;
        var newSrc = e.data.newSrc;
        if (!imgId || !newSrc) break;

        // Handle <img> elements
        var img = document.querySelector('[data-ve-img="' + imgId + '"]');
        if (img) {
          img.src = newSrc;
          img.removeAttribute('srcset');
          img.removeAttribute('data-src');
          img.removeAttribute('loading');
          onContentChange();
          break;
        }

        // Handle background-image elements
        var bgEl = document.querySelector('[data-ve-bg="' + imgId + '"]');
        if (bgEl) {
          bgEl.style.backgroundImage = 'url(' + newSrc + ')';
          bgEl.setAttribute('data-ve-bg-url', newSrc);
          onContentChange();
        }
        break;
    }
  });
})();
`;
