import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                referralCode: true,
                referralsCount: true,
                referredById: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            referralCode: user.referralCode,
            referralsCount: user.referralsCount,
            tokensEarned: user.referralsCount * 5000,
            wasReferred: !!user.referredById,
        });
    } catch (error) {
        console.error('Referral stats error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
