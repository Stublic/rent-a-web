# Rent a Web - Next.js

Moderan Next.js web s Stripe pretplatama, SOLO integracija i email slanjem.

## 🚀 Deployment na Vercel

### 1. Push na GitHub
```bash
git add .
git commit -m "feat: Next.js migration with Stripe + SOLO"
git push origin stripe-testing
```

### 2. Deploy na Vercel
1. Idi na [vercel.com](https://vercel.com)
2. Klikni "Add New Project"
3. Importaj svoj GitHub repo
4. Dodaj Environment Variables (vidjeti dolje)
5. Deploy!

### 3. Environment Variables (Vercel Dashboard)

U Vercel project settings > Environment Variables, dodaj:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=(dobit ćete nakon postavljanja webhooks u Stripe)
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...
SOLO_API_TOKEN=cc99...
SMTP_HOST=mail.webica.hr
SMTP_PORT=465
SMTP_USER=info@webica.hr
SMTP_PASSWORD=(tvoja SMTP lozinka)
SMTP_FROM=Rent a Web <info@webica.hr>
ADMIN_EMAIL=info@webica.hr
```

### 4. Postavi Stripe Webhook

Nakon deploya na Vercel, dobivat ćeš URL (npr. `https://tvoj-app.vercel.app`)

1. Idi u [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Klikni "+ Add endpoint"
3. Dodaj URL: `https://tvoj-app.vercel.app/api/webhooks/stripe`
4. Odaberi event: `checkout.session.completed`
5. Kopiraj **Signing secret** (počinje s `whsec_...`)
6. Dodaj ga u Vercel Environment Variables kao `STRIPE_WEBHOOK_SECRET`

## 📧 Testiranje lokalno

```bash
npm run dev
```

Otvori `http://localhost:3000`

## 🎯 Što sve radi?

- ✅ **Stripe Checkout** - Sva 3 paketa povezana s Stripe pretplatama
- ✅ **Email slanje** - Contact forma šalje email na `info@webica.hr` + confirmation korisniku
- ✅ **SOLO integracija** - Automatsko kreiranje računa u SOLO servisu nakon uspješne pretplate
- ✅ **Next.js App Router** - Moderna Next.js 16 struktura
- ✅ **Tailwind CSS** - Moderne animacije i dizajn

## 📝 TODO

- [ ] Dodati SMTP lozinku u `.env.local` (ili Vercel)
- [ ] Testirati Stripe Webhook nakon deploya
- [ ] Potvrditi SOLO API credentials
