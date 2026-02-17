import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// The main app domain (e.g., rent.webica.hr)
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "webica.hr";
const MAIN_HOST = `rent.${ROOT_DOMAIN}`;

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get("host") || "";
    const url = request.nextUrl.clone();

    // ─── Tenant detection ───────────────────────────────────────────
    // Check if this is a tenant subdomain (e.g., moj-projekt.webica.hr)
    // or a custom domain (not the main app, not localhost, not vercel.app)
    const isMainApp =
        hostname === MAIN_HOST ||
        hostname === `www.${ROOT_DOMAIN}` ||
        hostname === ROOT_DOMAIN ||
        hostname.includes("localhost") ||
        hostname.includes("127.0.0.1") ||
        hostname.endsWith(".vercel.app");

    if (!isMainApp) {
        // This is a tenant request — either subdomain or custom domain
        let tenantIdentifier = hostname;

        // Check if it's a subdomain of our root domain
        if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
            tenantIdentifier = hostname.replace(`.${ROOT_DOMAIN}`, "");
        }

        // Rewrite to the catch-all site route: /site/[domain]/[[...path]]
        const path = url.pathname === "/" ? "" : url.pathname;
        url.pathname = `/site/${tenantIdentifier}${path}`;
        return NextResponse.rewrite(url);
    }

    // ─── Main app: Protect dashboard and admin routes ───────────────
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie && (
        request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.startsWith("/admin") ||
        request.nextUrl.pathname.startsWith("/profile-setup")
    )) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - _next (Next.js internals)
         * - api (API routes — handled directly)
         * - static files (favicon, images, etc.)
         */
        "/((?!_next|api|favicon\\.ico|.*\\..*).*)",
    ],
};
