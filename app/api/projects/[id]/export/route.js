import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for image downloads

export async function GET(req, { params }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        // Find the project — must be owned by user (or admin) and EXPORTED_LOCKED
        const isAdmin = session.user.role === 'ADMIN';
        const project = isAdmin
            ? await prisma.project.findUnique({
                where: { id },
                select: {
                    generatedHtml: true,
                    reactFiles: true,
                    buyoutStatus: true,
                    name: true,
                    exportExpiresAt: true,
                    contentData: true,
                    planName: true,
                    userId: true,
                },
            })
            : await prisma.project.findFirst({
                where: { id, userId: session.user.id },
                select: {
                    generatedHtml: true,
                    reactFiles: true,
                    buyoutStatus: true,
                    name: true,
                    exportExpiresAt: true,
                    contentData: true,
                    planName: true,
                    userId: true,
                },
            });

        if (!project) {
            return new Response('Projekt nije pronađen.', { status: 404 });
        }

        if (project.buyoutStatus !== 'EXPORTED_LOCKED' && project.buyoutStatus !== 'MAINTAINED') {
            return new Response('Ovaj projekt nije otkupljen za preuzimanje.', { status: 403 });
        }

        // Check if the export period has expired (only for EXPORTED_LOCKED)
        if (project.buyoutStatus === 'EXPORTED_LOCKED' && project.exportExpiresAt && new Date(project.exportExpiresAt) < new Date()) {
            return new Response('Rok za preuzimanje je istekao.', { status: 410 });
        }

        if (!project.generatedHtml) {
            return new Response('Nema generiranog koda za preuzimanje.', { status: 404 });
        }

        // ─── Build ZIP archive ───
        const zip = new JSZip();

        // Collect all image URLs from all HTML files to download and localize
        const imageMap = new Map(); // url -> local filename
        let imageCounter = 0;

        /**
         * Find all external image URLs in HTML and replace them with local paths.
         * Returns the modified HTML.
         */
        function localizeImages(html, subfolder = '') {
            if (!html) return html;

            // Match src="..." attributes with http URLs (images)
            const imgRegex = /(?:src|content)=["'](https?:\/\/[^"']+\.(?:png|jpg|jpeg|gif|webp|svg|avif|ico)(?:\?[^"']*)?)["']/gi;
            let match;
            const replacements = [];

            while ((match = imgRegex.exec(html)) !== null) {
                const url = match[1];
                if (!imageMap.has(url)) {
                    imageCounter++;
                    // Extract extension from URL
                    const extMatch = url.match(/\.(png|jpg|jpeg|gif|webp|svg|avif|ico)/i);
                    const ext = extMatch ? extMatch[1].toLowerCase() : 'png';
                    const filename = `image-${imageCounter}.${ext}`;
                    imageMap.set(url, filename);
                }
                const localPath = subfolder
                    ? `../images/${imageMap.get(url)}`
                    : `images/${imageMap.get(url)}`;
                replacements.push({ original: match[1], local: localPath });
            }

            // Also catch CSS background-image: url(...)
            const bgRegex = /url\(["']?(https?:\/\/[^"')]+\.(?:png|jpg|jpeg|gif|webp|svg|avif|ico)(?:\?[^"')]*)?)\s*["']?\)/gi;
            while ((match = bgRegex.exec(html)) !== null) {
                const url = match[1];
                if (!imageMap.has(url)) {
                    imageCounter++;
                    const extMatch = url.match(/\.(png|jpg|jpeg|gif|webp|svg|avif|ico)/i);
                    const ext = extMatch ? extMatch[1].toLowerCase() : 'png';
                    const filename = `image-${imageCounter}.${ext}`;
                    imageMap.set(url, filename);
                }
                const localPath = subfolder
                    ? `../images/${imageMap.get(url)}`
                    : `images/${imageMap.get(url)}`;
                replacements.push({ original: match[1], local: localPath });
            }

            // Apply replacements
            for (const r of replacements) {
                html = html.split(r.original).join(r.local);
            }

            return html;
        }

        /**
         * Convert internal navigation links for static hosting.
         * /api/site/.../preview?page=slug → slug.html
         * /api/site/.../blog → blog/index.html
         * / → index.html
         */
        function staticifyLinks(html, currentLevel = '') {
            if (!html) return html;

            // Replace preview links: /api/site/xxx/preview?page=slug → slug.html
            html = html.replace(/href=["']\/api\/site\/[^"']*\/preview\?page=([^"'&]*)["']/gi, (_, slug) => {
                return `href="${currentLevel}${slug}.html"`;
            });
            // /api/site/xxx/preview → index.html
            html = html.replace(/href=["']\/api\/site\/[^"']*\/preview["']/gi, `href="${currentLevel}index.html"`);
            // /api/site/xxx/blog/slug → blog/slug.html
            html = html.replace(/href=["']\/api\/site\/[^"']*\/blog\/([^"']*)["']/gi, (_, slug) => {
                return `href="${currentLevel}blog/${slug}.html"`;
            });
            // /api/site/xxx/blog → blog/index.html
            html = html.replace(/href=["']\/api\/site\/[^"']*\/blog["']/gi, `href="${currentLevel}blog/index.html"`);

            // Also handle relative links: /slug → slug.html, / → index.html
            html = html.replace(/href=["']\/([a-z][a-z0-9-]*)["']/gi, (match, slug) => {
                // Don't convert external-looking paths or anchors
                if (['http', 'https', 'mailto', 'tel', 'javascript'].some(p => slug.startsWith(p))) return match;
                if (slug === 'blog') return `href="${currentLevel}blog/index.html"`;
                return `href="${currentLevel}${slug}.html"`;
            });
            html = html.replace(/href=["']\/["']/g, `href="${currentLevel}index.html"`);
            // href="#section" → keep as-is
            return html;
        }

        // 1. Homepage (index.html)
        let homepageHtml = localizeImages(project.generatedHtml);
        homepageHtml = staticifyLinks(homepageHtml);
        zip.file('index.html', homepageHtml);

        // 2. Subpages from reactFiles (Advanced plan)
        const reactFiles = (project.reactFiles || {});
        const subpageNames = {
            'o-nama': 'O nama',
            'usluge': 'Usluge',
            'kontakt': 'Kontakt',
        };
        for (const [slug, html] of Object.entries(reactFiles)) {
            if (typeof html === 'string' && html.trim()) {
                let subpageHtml = localizeImages(html);
                subpageHtml = staticifyLinks(subpageHtml);
                zip.file(`${slug}.html`, subpageHtml);
            }
        }

        // 3. Blog posts (Advanced plan)
        const blogPosts = await prisma.blogPost.findMany({
            where: { projectId: id, status: 'PUBLISHED' },
            include: { category: { select: { name: true, slug: true } } },
            orderBy: { publishedAt: 'desc' },
        });

        if (blogPosts.length > 0) {
            const blogFolder = zip.folder('blog');
            const contentData = project.contentData || {};
            const primaryColor = contentData.primaryColor || '#22c55e';
            const bizName = contentData.businessName || project.name;

            // Blog index page
            let blogIndexHtml = generateBlogIndexHtml(blogPosts, bizName, primaryColor);
            blogIndexHtml = localizeImages(blogIndexHtml, 'blog/');
            blogIndexHtml = staticifyLinks(blogIndexHtml, '../');
            blogFolder.file('index.html', blogIndexHtml);

            // Individual blog post pages
            for (const post of blogPosts) {
                let postHtml = generateBlogPostHtml(post, blogPosts, bizName, primaryColor);
                postHtml = localizeImages(postHtml, 'blog/');
                postHtml = staticifyLinks(postHtml, '../');
                blogFolder.file(`${post.slug}.html`, postHtml);
            }
        }

        // 4. Download all images and add to ZIP
        const imageFolder = zip.folder('images');
        const downloadPromises = [];

        for (const [url, filename] of imageMap) {
            downloadPromises.push(
                fetch(url, { signal: AbortSignal.timeout(10000) })
                    .then(res => {
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        return res.arrayBuffer();
                    })
                    .then(buffer => {
                        imageFolder.file(filename, buffer);
                    })
                    .catch(err => {
                        console.warn(`⚠️ Failed to download image: ${url} — ${err.message}`);
                        // Skip failed images silently
                    })
            );
        }

        // Wait for all image downloads (with a global timeout)
        await Promise.allSettled(downloadPromises);

        // 5. Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 },
        });

        // Get filename from query param (already ASCII-safe from client) or generate
        const url = new URL(req.url);
        const qFilename = url.searchParams.get('filename');
        const safeName = qFilename || (project.name || 'website')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase()
            .substring(0, 50) || 'website';

        const filename = `${safeName}-export.zip`;

        const responseHeaders = new Headers();
        responseHeaders.set('Content-Type', 'application/zip');
        responseHeaders.set('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
        responseHeaders.set('Content-Length', String(zipBuffer.length));
        responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        responseHeaders.set('Pragma', 'no-cache');

        return new NextResponse(Buffer.from(zipBuffer), {
            status: 200,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('Export error:', error);
        return new Response('Greška pri preuzimanju.', { status: 500 });
    }
}

// ─── Blog HTML generators ─────────────────────────────────────────────────

function generateBlogIndexHtml(posts, bizName, primaryColor) {
    const postCards = posts.map(post => `
        <a href="${post.slug}.html" class="blog-card">
            ${post.coverImage ? `<div class="blog-card-cover"><img src="${post.coverImage}" alt="${post.title}" loading="lazy" /></div>` : `<div class="blog-card-cover blog-card-cover-empty"></div>`}
            <div class="blog-card-content">
                ${post.category ? `<span class="blog-card-category">${post.category.name}</span>` : ''}
                <h2>${post.title}</h2>
                ${post.excerpt ? `<p>${post.excerpt}</p>` : ''}
                <span class="blog-card-date">${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('hr-HR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
            </div>
        </a>
    `).join('');

    return `<!DOCTYPE html>
<html lang="hr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog | ${bizName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #e5e5e5; }
        .blog-header { max-width: 1100px; margin: 0 auto; padding: 3rem 2rem 2rem; }
        .blog-header h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
        .blog-header p { color: #999; }
        .blog-header a { color: ${primaryColor}; text-decoration: none; font-size: 0.9rem; }
        .blog-grid { max-width: 1100px; margin: 0 auto; padding: 0 2rem 3rem; display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
        .blog-card { background: #18181b; border: 1px solid #27272a; border-radius: 1rem; overflow: hidden; text-decoration: none; color: inherit; transition: all 0.3s; }
        .blog-card:hover { border-color: ${primaryColor}44; transform: translateY(-3px); }
        .blog-card-cover { height: 200px; overflow: hidden; }
        .blog-card-cover-empty { background: #27272a; }
        .blog-card-cover img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .blog-card:hover .blog-card-cover img { transform: scale(1.05); }
        .blog-card-content { padding: 1.25rem; }
        .blog-card-category { display: inline-block; color: ${primaryColor}; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem; }
        .blog-card-content h2 { font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; line-height: 1.4; }
        .blog-card-content p { font-size: 0.85rem; color: #999; line-height: 1.6; margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .blog-card-date { font-size: 0.75rem; color: #666; }
        .back-link { display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="blog-header">
        <a href="../index.html" class="back-link">← ${bizName}</a>
        <h1>Blog</h1>
        <p>Najnoviji članci i vijesti</p>
    </div>
    <div class="blog-grid">
        ${postCards}
    </div>
</body>
</html>`;
}

function generateBlogPostHtml(post, allPosts, bizName, primaryColor) {
    const publishDate = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString('hr-HR', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    const relatedPosts = allPosts
        .filter(p => p.id !== post.id)
        .slice(0, 3);

    const relatedHtml = relatedPosts.length > 0 ? `
        <section class="related-section">
            <h2>Pročitajte još</h2>
            <div class="related-grid">
                ${relatedPosts.map(p => `
                    <a href="${p.slug}.html" class="related-card">
                        ${p.coverImage ? `<div class="related-cover"><img src="${p.coverImage}" alt="${p.title}" loading="lazy" /></div>` : `<div class="related-cover related-cover-empty"></div>`}
                        <div class="related-info">
                            <h3>${p.title}</h3>
                            ${p.excerpt ? `<p>${p.excerpt}</p>` : ''}
                        </div>
                    </a>
                `).join('')}
            </div>
        </section>
    ` : '';

    return `<!DOCTYPE html>
<html lang="hr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.metaTitle || post.title} | ${bizName}</title>
    <meta name="description" content="${post.metaDescription || post.excerpt || ''}">
    ${post.coverImage ? `<meta property="og:image" content="${post.coverImage}">` : ''}
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #e5e5e5; }
        .post-nav { max-width: 800px; margin: 0 auto; padding: 2rem 2rem 0; display: flex; gap: 1rem; }
        .post-nav a { color: ${primaryColor}; text-decoration: none; font-size: 0.85rem; }
        .post-header { max-width: 800px; margin: 0 auto; padding: 1.5rem 2rem; }
        .post-header .date { color: #666; font-size: 0.85rem; margin-bottom: 0.5rem; }
        .post-header h1 { font-size: 2.25rem; font-weight: 800; line-height: 1.3; margin-bottom: 0.75rem; }
        .post-header .excerpt { font-size: 1.1rem; color: #999; line-height: 1.7; padding-bottom: 1.5rem; border-bottom: 1px solid #27272a; }
        ${post.coverImage ? `.post-cover { max-width: 800px; margin: 0 auto; padding: 0 2rem; }
        .post-cover img { width: 100%; height: 400px; object-fit: cover; border-radius: 1rem; }` : ''}
        .post-content { max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.8; }
        .post-content h2 { font-size: 1.5rem; font-weight: 700; color: ${primaryColor}; margin: 2rem 0 0.75rem; }
        .post-content h3 { font-size: 1.2rem; font-weight: 600; margin: 1.5rem 0 0.5rem; }
        .post-content p { margin: 0.85rem 0; }
        .post-content a { color: ${primaryColor}; }
        .post-content ul, .post-content ol { padding-left: 1.5rem; margin: 0.75rem 0; }
        .post-content li { margin: 0.35rem 0; }
        .post-content blockquote { border-left: 3px solid ${primaryColor}; padding: 1rem 1.25rem; margin: 1.5rem 0; background: #18181b; border-radius: 0 0.75rem 0.75rem 0; color: #999; font-style: italic; }
        .post-content img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1.5rem 0; }
        .post-content code { background: #27272a; padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-size: 0.9em; }
        .related-section { max-width: 800px; margin: 2rem auto; padding: 0 2rem 3rem; }
        .related-section h2 { font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; padding-top: 2rem; border-top: 1px solid #27272a; }
        .related-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
        .related-card { background: #18181b; border: 1px solid #27272a; border-radius: 0.75rem; overflow: hidden; text-decoration: none; color: inherit; transition: all 0.3s; }
        .related-card:hover { border-color: ${primaryColor}44; transform: translateY(-2px); }
        .related-cover { height: 130px; overflow: hidden; }
        .related-cover-empty { background: #27272a; }
        .related-cover img { width: 100%; height: 100%; object-fit: cover; }
        .related-info { padding: 1rem; }
        .related-info h3 { font-size: 0.9rem; font-weight: 700; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .related-info p { font-size: 0.8rem; color: #999; margin-top: 0.4rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @media (max-width: 640px) {
            .post-header h1 { font-size: 1.5rem; }
            .post-cover img { height: 220px; }
        }
    </style>
</head>
<body>
    <div class="post-nav">
        <a href="../index.html">← ${bizName}</a>
        <a href="index.html">Blog</a>
    </div>
    ${post.coverImage ? `<div class="post-cover"><img src="${post.coverImage}" alt="${post.title}" /></div>` : ''}
    <div class="post-header">
        ${post.category ? `<span style="color:${primaryColor};font-size:0.85rem;font-weight:600">${post.category.name}</span>` : ''}
        <div class="date">${publishDate}</div>
        <h1>${post.title}</h1>
        ${post.excerpt ? `<p class="excerpt">${post.excerpt}</p>` : ''}
    </div>
    <div class="post-content">
        ${post.content}
    </div>
    ${relatedHtml}
</body>
</html>`;
}
