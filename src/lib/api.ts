const API_BASE_URL = '/api';

export interface Message {
    id?: string;
    isUser: boolean;
    text: string;
    htmlContent?: string;
    imageData?: string;
    timestamp?: string;
}

export interface Conversation {
    id: string;
    title: string;
    lastUpdated?: string;
}

export interface ChatResponse {
    status: string;
    response: string;
    model: string;
}

// Check if API is available (only works on Vercel, not local dev)
const isApiAvailable = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
        return response.ok;
    } catch {
        return false;
    }
};

// Send chat message to AI
export async function sendChatMessage(
    message: string,
    history: Message[],
    model: 'gemini' | 'deepseek' = 'gemini',
    imageData?: string
): Promise<ChatResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                history,
                model,
                imageData,
            }),
        });

        if (!response.ok) {
            // Check if it's a 404 (API not deployed) or other error
            if (response.status === 404) {
                return {
                    status: 'error',
                    response: '⚠️ **API belum tersedia di local development.**\n\nUntuk menggunakan chat:\n1. Deploy ke Vercel, atau\n2. Jalankan `vercel dev` untuk test API lokal\n\nPastikan juga API keys sudah dikonfigurasi di environment variables.',
                    model: model,
                };
            }
            throw new Error('Failed to send message');
        }

        return response.json();
    } catch (error) {
        console.warn('Chat API not reachable:', error);
        return {
            status: 'error',
            response: '⚠️ **Tidak dapat terhubung ke API.**\n\nPython API hanya berjalan di Vercel. Untuk development lokal:\n1. Deploy ke Vercel, atau\n2. Gunakan `vercel dev` untuk menjalankan serverless functions',
            model: model,
        };
    }
}

// Get all conversations for a user
export async function getConversations(userId: string): Promise<Conversation[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/conversations?userId=${userId}`, {
            method: 'GET',
            headers: {
                'X-User-Id': userId,
            },
        });

        if (!response.ok) {
            // API not available in local dev
            console.warn('Conversations API not available (expected in local dev)');
            return [];
        }

        const data = await response.json();
        return data.conversations || [];
    } catch (error) {
        // Network error - API not running
        console.warn('Conversations API not reachable:', error);
        return [];
    }
}

// Get messages for a conversation
export async function getConversationMessages(
    userId: string,
    conversationId: string
): Promise<Message[]> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/conversations/${conversationId}?userId=${userId}`,
            {
                method: 'GET',
                headers: {
                    'X-User-Id': userId,
                },
            }
        );

        if (!response.ok) {
            console.warn('Messages API not available');
            return [];
        }

        const data = await response.json();
        return data.messages || [];
    } catch (error) {
        console.warn('Messages API not reachable:', error);
        return [];
    }
}

// Save a message to a conversation
export async function saveMessage(
    userId: string,
    conversationId: string | null,
    messageData: Message
): Promise<{ conversationId: string } | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                conversationId,
                messageData,
            }),
        });

        if (!response.ok) {
            console.warn('Save message API not available');
            return null;
        }

        return response.json();
    } catch (error) {
        console.warn('Save message API not reachable:', error);
        return null;
    }
}

// Update conversation title
export async function updateConversationTitle(
    userId: string,
    conversationId: string,
    title: string
): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                title,
            }),
        });

        return response.ok;
    } catch (error) {
        console.warn('Update title API not reachable:', error);
        return false;
    }
}

// Delete a conversation
export async function deleteConversation(
    userId: string,
    conversationId: string
): Promise<boolean> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/conversations/${conversationId}?userId=${userId}`,
            {
                method: 'DELETE',
                headers: {
                    'X-User-Id': userId,
                },
            }
        );

        return response.ok;
    } catch (error) {
        console.warn('Delete conversation API not reachable:', error);
        return false;
    }
}

export { isApiAvailable };
