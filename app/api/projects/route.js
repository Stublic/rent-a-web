import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    let session;
    try {
        console.log("API /projects - Start request");

        let headersList;
        try {
            headersList = await headers();
            console.log("API /projects - Headers retrieved");
        } catch (hErr) {
            console.error(`API /projects - Headers Error: ${hErr.message}`);
            throw hErr;
        }

        try {
            session = await auth.api.getSession({
                headers: headersList
            });
            console.log(`API /projects - Session retrieved: ${session ? session.user.email : "No session"}`);
        } catch (sErr) {
            console.error(`API /projects - Session Error: ${sErr.message}`);
            throw sErr;
        }

        // Explicitly check for session
        if (!session || !session.user || !session.user.id) {
            console.log("API /projects - Unauthorized (Missing session/user)");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log(`API /projects - Querying projects for user ${session.user.id}`);
        let projects;
        try {
            projects = await prisma.project.findMany({
                where: { userId: session.user.id },
                orderBy: { createdAt: 'desc' }
            });
            console.log(`API /projects - Query successful. Found ${projects ? projects.length : 0} projects.`);
        } catch (dbErr) {
            console.error(`API /projects - DB Query Error: ${dbErr.message}`);
            console.error("DB Query Error:", dbErr);
            throw dbErr;
        }

        // Debug console log
        console.log("API /projects - Found projects:", projects);

        // Explicitly check for array
        if (!Array.isArray(projects)) {
            console.error("API /projects - Prisma returned non-array:", projects);
            return NextResponse.json({ error: "Internal Server Error: Data format" }, { status: 500 });
        }

        return NextResponse.json(projects);

    } catch (error) {
        console.error("Projects API Error:", error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
