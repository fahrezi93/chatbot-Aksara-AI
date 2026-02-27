import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App | undefined;
let db: Firestore | undefined;

function getFirestoreDb(): Firestore | null {
    if (db) return db;

    try {
        const adminSdkJson = process.env.FIREBASE_ADMIN_SDK_JSON;
        if (!adminSdkJson) {
            console.warn('FIREBASE_ADMIN_SDK_JSON not configured');
            return null;
        }

        const serviceAccount = JSON.parse(adminSdkJson);

        if (getApps().length === 0) {
            app = initializeApp({
                credential: cert(serviceAccount),
            });
        } else {
            app = getApps()[0];
        }

        db = getFirestore(app);
        return db;
    } catch (error) {
        console.error('Firebase Admin init error:', error);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const firestore = getFirestoreDb();
    if (!firestore) {
        return NextResponse.json({ preferences: null });
    }

    try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (userDoc.exists) {
            return NextResponse.json({ preferences: userDoc.data()?.preferences || null });
        }
        return NextResponse.json({ preferences: null });
    } catch (error) {
        console.error('Fetch preferences error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan saat mengambil preferensi' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, preferences } = body;

        if (!userId || !preferences) {
            return NextResponse.json({ error: 'userId and preferences required' }, { status: 400 });
        }

        const firestore = getFirestoreDb();
        if (!firestore) {
            return NextResponse.json({ success: false, message: 'Firebase not configured' });
        }

        await firestore.collection('users').doc(userId).set({ preferences }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Save preferences error:', error);
        return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }
}
