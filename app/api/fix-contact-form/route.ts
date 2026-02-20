import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/**
 * POST /api/fix-contact-form
 * 
 * Surgically injects the functional contact form JS into a project's generatedHtml.
 * This is needed for projects generated before the fetch()-based contact form was added.
 * Safe to call multiple times — detects if already injected.
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const isAdmin = (session.user as any).role === 'ADMIN';
    const project = isAdmin
      ? await prisma.project.findUnique({ where: { id: projectId } })
      : await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } });

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    if (!project.generatedHtml) return NextResponse.json({ error: 'No generated HTML' }, { status: 400 });

    // Check if already has working contact form (v2 marker)
    if (project.generatedHtml.includes('webica-contact-v2')) {
      return NextResponse.json({ alreadyFixed: true, message: 'Contact form already functional (v2)' });
    }

    // Remove old v1 injection if present (replace it with v2)
    let baseHtml = project.generatedHtml;
    if (baseHtml.includes('Webica Contact Form Handler')) {
      // Strip old script block
      baseHtml = baseHtml.replace(/<script>\s*\/\/ ─── Webica Contact Form Handler[\s\S]*?<\/script>/g, '');
    }

    // Build the injection script
    const contactScript = `
<script data-webica-contact-v2>
// ─── Webica Contact Form Handler ─────────────────────────────────────────────
(function() {
  var PROJECT_ID = '${projectId}';
  var API_URL = 'https://webica.hr/api/site/' + PROJECT_ID + '/contact';

  document.querySelectorAll('form').forEach(function(form) {
    // Skip if already handled
    if (form.dataset.webicaHandled) return;
    form.dataset.webicaHandled = '1';

        // Check if this looks like a contact form (has name + message fields or email)
        var hasEmail = form.querySelector('input[type="email"], input[name*="email"], input[placeholder*="mail"], input[placeholder*="Mail"]');
        var hasMessage = form.querySelector('textarea, input[name*="message"], input[name*="poruka"], input[name*="opis"], input[name*="napomena"]');
        var hasTelephone = form.querySelector('input[type="tel"], input[name*="phone"], input[name*="telefon"], input[placeholder*="telefon"], input[placeholder*="Telefon"]');
        if (!hasMessage && !hasTelephone && !hasEmail) return; // skip non-contact forms

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();

      var btn = form.querySelector('button[type="submit"], input[type="submit"], button:last-of-type');
      var originalText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Slanje...'; }

      // Collect field values (search by common patterns)
      function findVal(selectors) {
        for (var i = 0; i < selectors.length; i++) {
          var el = form.querySelector(selectors[i]);
          if (el && el.value.trim()) return el.value.trim();
        }
        return '';
      }

      var name = findVal(['input[name="name"]','input[name="ime"]','input[placeholder*="ime"]','input[placeholder*="Ime"]','input[placeholder*="prezime"]','input[type="text"]:not([type="email"]):not([type="tel"])']);
      var email = findVal(['input[type="email"]','input[name="email"]','input[name="mail"]','input[placeholder*="mail"]','input[placeholder*="Mail"]','input[placeholder*="E-mail"]']);
      var phone = findVal(['input[type="tel"]','input[name="phone"]','input[name="telefon"]','input[name="mob"]','input[placeholder*="telefon"]','input[placeholder*="Telefon"]','input[placeholder*="Broj"]']);
      var message = findVal(['textarea','[name="message"]','[name="poruka"]','[name="opis"]','[name="napomena"]','[placeholder*="opis"]','[placeholder*="napomena"]','[placeholder*="Napomena"]','[placeholder*="Opis"]','[placeholder*="poruka"]','[placeholder*="Poruka"]']);

      // Name is required, message or phone required, email optional
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
        body: JSON.stringify({ name: name, email: email, phone: phone || '', message: message })
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

    // Inject before </body> (or at end if no </body>)
    let updatedHtml = baseHtml;
    if (updatedHtml.includes('</body>')) {
      updatedHtml = updatedHtml.replace('</body>', contactScript + '\n</body>');
    } else {
      updatedHtml = updatedHtml + '\n' + contactScript;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { generatedHtml: updatedHtml },
    });

    console.log(`✅ Contact form fixed for project ${projectId}`);
    return NextResponse.json({ success: true, message: 'Contact form is now functional' });

  } catch (err: any) {
    console.error('fix-contact-form error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
