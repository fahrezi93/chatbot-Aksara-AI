import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

// Helper to generate title using Gemini
async function generateTitle(message: string): Promise<string> {
    try {
        if (!process.env.GEMINI_API_KEY) return '';

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(
            `Analisis pesan pertama user ini dan buatkan judul topik yang sangat ringkas (maksimal 5 kata). 
            Aturan:
            1. HANYA berikan judul.
            2. JANGAN menjawab pertanyaan.
            3. JANGAN gunakan kata pembuka seperti "Berikut", "Ini adalah", "Halo", "Judul".
            4. Gunakan Bahasa Indonesia.
            5. Contoh output bagus: "Resep Kue", "Tips Coding", "Rencana Liburan".
            
            Pesan User: "${message.substring(0, 200)}"`
        );
        return result.response.text().trim().replace(/^["']|["']$/g, ''); // Remove quotes if any
    } catch (error) {
        console.error('Title generation error:', error);
        return '';
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const conversationId = request.nextUrl.pathname.split('/').pop();

    if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const firestore = getFirestoreDb();
    if (!firestore) {
        return NextResponse.json({ conversations: [] });
    }

    try {
        // If specific conversation ID, get messages
        if (conversationId && conversationId !== 'conversations') {
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
        }

        // Get all conversations with pagination
        const conversationsRef = firestore
            .collection('users')
            .doc(userId)
            .collection('conversations');

        const limit = parseInt(searchParams.get('limit') || '20');
        const startAfter = searchParams.get('startAfter');

        let query = conversationsRef.orderBy('lastUpdated', 'desc').limit(limit);

        if (startAfter) {
            query = query.startAfter(startAfter);
        }

        const snapshot = await query.get();
        const conversations = snapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title || 'Untitled',
            lastUpdated: doc.data().lastUpdated,
            systemPrompt: doc.data().systemPrompt || '',
        }));

        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        const nextCursor = lastDoc ? lastDoc.data().lastUpdated : null;
        const hasMore = snapshot.docs.length === limit;

        return NextResponse.json({
            conversations,
            pagination: {
                nextCursor,
                hasMore
            }
        });
    } catch (error) {
        console.error('Firestore error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan saat mengambil percakapan' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, conversationId, messageData } = body;

        if (!userId || !messageData) {
            return NextResponse.json({ error: 'userId and messageData required' }, { status: 400 });
        }

        const firestore = getFirestoreDb();
        if (!firestore) {
            // Return mock conversation ID if Firebase not configured
            return NextResponse.json({
                conversationId: conversationId || `local-${Date.now()}`,
                message: 'Firebase not configured - messages not saved'
            });
        }

        let convId = conversationId;

        // Create new conversation if needed
        if (!convId) {
            const conversationsRef = firestore
                .collection('users')
                .doc(userId)
                .collection('conversations');

            // Generate title using AI
            let title = messageData.text?.substring(0, 50) || 'New Chat';
            if (messageData.text) {
                const aiTitle = await generateTitle(messageData.text);
                if (aiTitle) {
                    title = aiTitle;
                }
            }

            const newConv = await conversationsRef.add({
                title,
                lastUpdated: new Date().toISOString(),
                ...(body.systemPrompt ? { systemPrompt: body.systemPrompt } : {}),
            });
            convId = newConv.id;
        }

        // Add message
        const messagesRef = firestore
            .collection('users')
            .doc(userId)
            .collection('conversations')
            .doc(convId)
            .collection('messages');

        await messagesRef.add({
            ...messageData,
            timestamp: new Date().toISOString(),
        });

        // Update conversation lastUpdated
        await firestore
            .collection('users')
            .doc(userId)
            .collection('conversations')
            .doc(convId)
            .update({ lastUpdated: new Date().toISOString() });

        return NextResponse.json({ conversationId: convId });
    } catch (error) {
        console.error('Save message error:', error);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, conversationId, title, systemPrompt } = body;

        if (!userId || !conversationId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // At least one field to update
        if (title === undefined && systemPrompt === undefined) {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
        }

        const firestore = getFirestoreDb();
        if (!firestore) {
            return NextResponse.json({ success: false, message: 'Firebase not configured' });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;

        await firestore
            .collection('users')
            .doc(userId)
            .collection('conversations')
            .doc(conversationId)
            .update(updateData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update conversation error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan saat memperbarui percakapan' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const conversationId = request.nextUrl.pathname.split('/').pop();

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
        return NextResponse.json({ error: 'Terjadi kesalahan saat menghapus percakapan' }, { status: 500 });
    }
}
