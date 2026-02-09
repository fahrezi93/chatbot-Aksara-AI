const { loadEnvConfig } = require('@next/env');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function inspect() {
    const projectDir = process.cwd();
    loadEnvConfig(projectDir);
    
    console.log('Environment loaded.');

    const adminSdkJson = process.env.FIREBASE_ADMIN_SDK_JSON;
    if (!adminSdkJson) {
        console.error('FIREBASE_ADMIN_SDK_JSON not found in .env');
        console.log('Available keys:', Object.keys(process.env).filter(k => k.startsWith('FIREBASE')));
        process.exit(1);
    }

    try {
        const serviceAccount = JSON.parse(adminSdkJson);
        const app = initializeApp({
            credential: cert(serviceAccount)
        });
        const db = getFirestore(app);

        console.log('Listing collections...');
        const collections = await db.listCollections();
        const collectionIds = collections.map(c => c.id);
        console.log('Collectionsfound:', collectionIds);

        // Global search for 'messages' via collectionGroup
        console.log('\nPerforming global search for "messages" collections...');
        const messagesQuery = db.collectionGroup('messages').limit(5);
        const messagesSnapshot = await messagesQuery.get();

        if (messagesSnapshot.empty) {
            console.log('  No "messages" collections found globally.');
            
            // Try searching 'chats' as a root collection or subcollection
             console.log('\nPerforming global search for "chats" collections...');
             const chatsQuery = db.collectionGroup('chats').limit(5);
             const chatsSnapshot = await chatsQuery.get();
             if (chatsSnapshot.empty) {
                 console.log('  No "chats" collections found globally either.');
             } else {
                 console.log(`  Found ${chatsSnapshot.size} documents in "chats" collections.`);
                 chatsSnapshot.forEach(doc => {
                     console.log(`    Chat Doc ID: ${doc.id}`);
                     console.log(`    Parent Path: ${doc.ref.parent.path}`);
                     console.log(`    Data keys: ${Object.keys(doc.data())}`);
                 });
             }

        } else {
            console.log(`  Found ${messagesSnapshot.size} documents in "messages" collections.`);
            messagesSnapshot.forEach(doc => {
                console.log(`    Message Doc ID: ${doc.id}`);
                console.log(`    Parent Path: ${doc.ref.parent.path}`); // Key info: tells us the full path structure
                const parentPath = doc.ref.parent.path;
                // pattern: users/{userId}/conversations/{convId}/messages
                // or: chats/{chatId}/messages
                console.log(`    Grandparent Path: ${doc.ref.parent.parent ? doc.ref.parent.parent.path : 'root'}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

inspect();
