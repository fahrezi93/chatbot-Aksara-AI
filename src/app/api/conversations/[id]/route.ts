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

// GET /api/conversations/[id] - Get messages for a conversation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId || !conversationId) {
        return NextResponse.json({ error: 'userId and conversationId required' }, { status: 400 });
    }

    const firestore = getFirestoreDb();
    if (!firestore) {
        return NextResponse.json({ messages: [] });
    }

    try {
        const messagesRef = firestore
            .collection('users')
            .doc(userId)
            .collection('conversations')
            .doc(conversationId)
            .collection('messages');

        const snapshot = await messagesRef.orderBy('timestamp', 'asc').get();
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json({ messages: [] });
    }
}

// PUT /api/conversations/[id] - Update conversation title
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: conversationId } = await params;

    try {
        const body = await request.json();
        const { userId, title } = body;

        if (!userId || !conversationId || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const firestore = getFirestoreDb();
        if (!firestore) {
            return NextResponse.json({ success: false, message: 'Firebase not configured' });
        }

        await firestore
            .collection('users')
            .doc(userId)
            .collection('conversations')
            .doc(conversationId)
            .update({ title });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update title error:', error);
        return NextResponse.json({ error: 'Failed to update title' }, { status: 500 });
    }
}

// DELETE /api/conversations/[id] - Delete a conversation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId || !conversationId) {
        return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
    }

    const firestore = getFirestoreDb();
    if (!firestore) {
        return NextResponse.json({ success: false, message: 'Firebase not configured' });
    }

    try {
        // Delete all messages first
        const messagesRef = firestore
            .collection('users')
            .doc(userId)
            .collection('conversations')
            .doc(conversationId)
            .collection('messages');

        const messages = await messagesRef.get();
        const batch = firestore.batch();
        messages.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // Delete conversation
        await firestore
            .collection('users')
            .doc(userId)
            .collection('conversations')
            .doc(conversationId)
            .delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete conversation error:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
