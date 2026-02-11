import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    const logFile = path.join(process.cwd(), 'logs', 'api-projects.log');
    const log = (msg) => {
        const timestamp = new Date().toISOString();
        if (!fs.existsSync(path.dirname(logFile))) fs.mkdirSync(path.dirname(logFile), { recursive: true });
        fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    };

    let session;
    try {
        log("API /projects - Start request");

        let headersList;
        try {
            headersList = await headers();
            log("API /projects - Headers retrieved");
        } catch (hErr) {
            log(`API /projects - Headers Error: ${hErr.message}`);
            throw hErr;
        }

        try {
            session = await auth.api.getSession({
                headers: headersList
            });
            log(`API /projects - Session retrieved: ${session ? session.user.email : "No session"}`);
        } catch (sErr) {
            log(`API /projects - Session Error: ${sErr.message}`);
            throw sErr;
        }

        // Debug log
        console.log("API /projects - Session:", session ? session.user.email : "No session");

        // Explicitly check for session again
        if (!session || !session.user || !session.user.id) {
            log("API /projects - Unauthorized (Missing session/user)");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        log(`API /projects - Querying projects for user ${session.user.id}`);
        let projects;
        try {
            projects = await prisma.project.findMany({
                where: { userId: session.user.id },
                orderBy: { createdAt: 'desc' }
            });
            log(`API /projects - Query succesful. Found ${projects ? projects.length : 0} projects.`);
        } catch (dbErr) {
            log(`API /projects - DB Query Error: ${dbErr.message}`);
            console.error("DB Query Error:", dbErr);
            throw dbErr;
        }

        // Debug console log
        console.log("API /projects - Found projects:", projects);

        // Explicitly check for array
        if (!Array.isArray(projects)) {
            log("API /projects - Prisma returned non-array: " + JSON.stringify(projects));
            console.error("API /projects - Prisma returned non-array:", projects);
            return NextResponse.json({ error: "Internal Server Error: Data format" }, { status: 500 });
        }

        return NextResponse.json(projects);

    } catch (error) {
        console.error("Projects API Error:", error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
