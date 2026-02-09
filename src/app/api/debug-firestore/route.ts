import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Duplicate initialization logic since we can't easily import from the other route if it's not exported nicely
// Ideally this should be in a shared lib, but for a quick debug route this is fine.
function getDb() {
    let app: App;
    const adminSdkJson = process.env.FIREBASE_ADMIN_SDK_JSON;
    if (!adminSdkJson) return null;

    if (getApps().length === 0) {
        app = initializeApp({
            credential: cert(JSON.parse(adminSdkJson)),
        }, 'debug-app'); // Use a different app name to avoid conflicts if needed, or re-use default
    } else {
        app = getApps()[0];
    }
    return getFirestore(app);
}

export async function GET() {
    try {
        const db = getDb();
        if (!db) return NextResponse.json({ error: 'DB not init' });

        const collections = await db.listCollections();
        const collectionIds = collections.map(c => c.id);

        // Also check if there's a 'conversations' collection and sample a doc
        let sampleData = null;
        if (collectionIds.includes('conversations')) {
            const snapshot = await db.collection('conversations').limit(1).get();
            if (!snapshot.empty) {
                sampleData = snapshot.docs[0].data();
            }
        }

        // Check 'chats' collection too
        if (collectionIds.includes('chats')) {
            const snapshot = await db.collection('chats').limit(1).get();
            if (!snapshot.empty) {
                sampleData = { ...sampleData, chatSample: snapshot.docs[0].data() };
            }
        }

        return NextResponse.json({
            collections: collectionIds,
            sampleData
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
