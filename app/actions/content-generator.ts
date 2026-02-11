'use server';

import { put } from '@vercel/blob';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

import { contentSchema } from '@/lib/schemas';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export async function uploadImageAction(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file uploaded');
    }

    const blob = await put(file.name, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return blob.url;
}

export async function generateWebsiteAction(projectId: string, formData: any) {
    // 1. Authentication Check
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        throw new Error("Unauthorized");
    }

    // 2. Validation
    const validatedFields = contentSchema.safeParse(formData);

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const data = validatedFields.data;

    try {
        // 3. Update Project Status to PROCESSING
        await prisma.project.update({
            where: { id: projectId },
            data: {
                contentData: data as any,
                status: "PROCESSING"
            }
        });

        // 4. Generate Content with Gemini
        const prompt = `
You are a Senior Frontend Engineer and UI/UX Designer.
Your task: Generate a SINGLE, self-contained HTML file for a landing page based on the client's data.

**TECHNICAL REQUIREMENTS:**
1.  **Output:** Return ONLY valid HTML code. Start with <!DOCTYPE html>. Do NOT use markdown tags (\`\`\`html).
2.  **Framework:** Use Tailwind CSS via CDN.
    - <script src="https://cdn.tailwindcss.com"></script>
    - Configure Tailwind theme in a <script> tag to use the client's \`primaryColor\` as the main brand color.
3.  **Animations:** Use GSAP + ScrollTrigger via CDN.
    - <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    - <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    - Apply \`gsap.from()\` animations to elements with a class like \`.animate-up\` (fade up & slide).
4.  **Images:**
    - If \`logoUrl\` or \`heroImageUrl\` are provided in JSON, use them.
    - If missing, use high-quality placeholders: https://placehold.co/800x600/EEE/31343C?text=Image
5.  **Design:** Modern, clean, whitespace-heavy, mobile-first.
6.  **Content:**
    - Write persuasive marketing copy based on the raw \`description\` and \`industry\` inputs.
    - Sections: Navbar, Hero (High Impact), Features (Grid), About, Services, Contact/Footer.

**CLIENT INPUT DATA (JSON):**
${JSON.stringify(data)}

**OUTPUT:**
Only the HTML code.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // 5. Sanitize Output (remove markdown blocks if Gemini adds them)
        text = text.replace(/```html/g, '').replace(/```/g, '');

        // 6. Update Project with Result
        await prisma.project.update({
            where: { id: projectId },
            data: {
                generatedHtml: text,
                status: "GENERATED",
                aiVersion: { increment: 1 }
            }
        });

        revalidatePath(`/dashboard/projects/${projectId}`);
        return { success: true };

    } catch (error: any) {
        console.error("Generation Error:", error);

        // Revert status on error
        await prisma.project.update({
            where: { id: projectId },
            data: { status: "DRAFT" }
        });

        return { error: "Failed to generate website. Please try again." };
    }
}
