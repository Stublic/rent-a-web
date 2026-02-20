/**
 * Generates the contact form JS script tag to inject into generated HTML.
 * This script intercepts all contact-like forms and POSTs to the Webica API.
 */
export function getContactFormScript(projectId: string): string {
    return `
<script data-webica-contact-v2>
// ─── Webica Contact Form Handler v2 ─────────────────────────────────────
(function() {
  var PROJECT_ID = '${projectId}';
  var API_URL = 'https://webica.hr/api/site/' + PROJECT_ID + '/contact';

  document.querySelectorAll('form').forEach(function(form) {
    if (form.dataset.webicaHandled) return;
    form.dataset.webicaHandled = '1';

    var hasEmail = form.querySelector('input[type="email"], input[name*="email"], input[placeholder*="mail"], input[placeholder*="Mail"]');
    var hasMessage = form.querySelector('textarea, input[name*="message"], input[name*="poruka"], input[name*="opis"], input[name*="napomena"]');
    var hasTelephone = form.querySelector('input[type="tel"], input[name*="phone"], input[name*="telefon"], input[placeholder*="telefon"], input[placeholder*="Telefon"]');
    if (!hasMessage && !hasTelephone && !hasEmail) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();

      var btn = form.querySelector('button[type="submit"], input[type="submit"], button:last-of-type');
      var originalText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Slanje...'; }

      function findVal(selectors) {
        for (var i = 0; i < selectors.length; i++) {
          var el = form.querySelector(selectors[i]);
          if (el && el.value && el.value.trim()) return el.value.trim();
        }
        return '';
      }

      var name = findVal(['input[name="name"]','input[name="ime"]','input[placeholder*="ime"]','input[placeholder*="Ime"]','input[placeholder*="prezime"]','input[type="text"]']);
      var email = findVal(['input[type="email"]','input[name="email"]','input[name="mail"]','input[placeholder*="mail"]','input[placeholder*="E-mail"]']);
      var phone = findVal(['input[type="tel"]','input[name="phone"]','input[name="telefon"]','input[name="mob"]','input[placeholder*="telefon"]','input[placeholder*="Telefon"]','input[placeholder*="Broj"]']);
      var message = findVal(['textarea','[name="message"]','[name="poruka"]','[name="opis"]','[name="napomena"]','[placeholder*="poruka"]','[placeholder*="Poruka"]','[placeholder*="napomena"]','[placeholder*="Napomena"]']);

      if (!name) {
        alert('Molimo unesite ime.');
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
        return;
      }
      if (!message && !phone) {
        alert('Molimo unesite poruku ili broj telefona.');
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
        return;
      }

      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, phone: phone || '', message: message || ('Telefon: ' + phone) })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          form.innerHTML = '<div style="text-align:center;padding:32px 16px"><div style="font-size:48px;margin-bottom:12px">✓</div><p style="font-size:20px;font-weight:600;margin:0 0 8px">Hvala! Poruka je poslana.</p><p style="color:#666;margin:0">Javit ćemo vam se što prije.</p></div>';
        } else {
          alert(data.error || 'Greška pri slanju. Pokušajte ponovno.');
          if (btn) { btn.disabled = false; btn.textContent = originalText; }
        }
      })
      .catch(function() {
        alert('Greška pri slanju. Provjerite internetsku vezu i pokušajte ponovno.');
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
      });
    });
  });
})();
</script>`;
}

/**
 * Injects the contact form script into HTML.
 * Safe to call multiple times — checks for existing v2 marker.
 */
export function injectContactFormScript(html: string, projectId: string): string {
    // Already has v2
    if (html.includes('webica-contact-v2')) return html;

    // Remove old v1 if present
    let baseHtml = html;
    if (baseHtml.includes('Webica Contact Form Handler')) {
        baseHtml = baseHtml.replace(/<script>\s*\/\/ ─── Webica Contact Form Handler[\s\S]*?<\/script>/g, '');
    }

    const script = getContactFormScript(projectId);

    if (baseHtml.includes('</body>')) {
        return baseHtml.replace('</body>', script + '\n</body>');
    }
    return baseHtml + '\n' + script;
}
