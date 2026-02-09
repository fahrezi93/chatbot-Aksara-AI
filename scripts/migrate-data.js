const { loadEnvConfig } = require('@next/env');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function migrate() {
    const projectDir = process.cwd();
    loadEnvConfig(projectDir);
    
    // Init Firebase
    const adminSdkJson = process.env.FIREBASE_ADMIN_SDK_JSON;
    if (!adminSdkJson) {
        console.error('FIREBASE_ADMIN_SDK_JSON missing');
        process.exit(1);
    }
    
    const app = initializeApp({
        credential: cert(JSON.parse(adminSdkJson))
    });
    const db = getFirestore(app);

    const TARGET_USER_ID = 'AEFkNL8e9LcCiiLybjQFKU5YBZJ3'; // Target specific user first
    console.log(`Starting migration for user: ${TARGET_USER_ID}`);

    const oldConversationsRef = db.collection('chats').doc(TARGET_USER_ID).collection('conversations');
    const newConversationsRef = db.collection('users').doc(TARGET_USER_ID).collection('conversations');

    const snapshot = await oldConversationsRef.get();
    console.log(`Found ${snapshot.size} conversations in old path.`);

    let migratedCount = 0;
    const batchSize = 500;
    let batch = db.batch();
    let opCount = 0;

    for (const doc of snapshot.docs) {
        const convData = doc.data();
        const convId = doc.id;
        
        // 1. Copy Conversation Doc
        const newConvDoc = newConversationsRef.doc(convId);
        const existingcheck = await newConvDoc.get();
        
        if (!existingcheck.exists) {
             // Add lastUpdated if missing (default to now or created_at or timestamp or 0)
            const lastUpdated = convData.lastUpdated || convData.timestamp || convData.createdAt || Date.now();
            
            batch.set(newConvDoc, {
                ...convData,
                lastUpdated, 
                migrated: true,
                migratedAt: new Date()
            });
            opCount++;
        }

        // 2. Copy Messages
        const messagesSnapshot = await doc.ref.collection('messages').get();
        for (const msgDoc of messagesSnapshot.docs) {
            const msgData = msgDoc.data();
            const newMsgDoc = newConvDoc.collection('messages').doc(msgDoc.id);
            
            // Optimization: Only write if not exists? Or just overwrite?
            // For batch simplicity, just set check.
            // But checking every doc is slow. 
            // Since we know the conv didn't exist (mostly), we can just write.
            // To be safe, we perform set with merge: true or just set.
            
            batch.set(newMsgDoc, msgData);
            opCount++;

            if (opCount >= batchSize) {
                await batch.commit();
                batch = db.batch();
                opCount = 0;
                process.stdout.write('.');
            }
        }
        
        migratedCount++;
    }

    if (opCount > 0) {
        await batch.commit();
    }

    console.log(`\nMigration complete. Processed ${migratedCount} conversations.`);
}

migrate();
