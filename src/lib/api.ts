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
    systemPrompt?: string;
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

// Supported model types
export type AIModel = 'gemini' | 'deepseek' | 'llama' | 'qwen' | 'trinity' | 'stepfun' | 'glm';

// Send chat message to AI
export async function sendChatMessage(
    message: string,
    history: Message[],
    model: AIModel = 'gemini',
    imageData?: string,
    useSearch?: boolean,
    systemPrompt?: string
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
                useSearch,
                systemPrompt,
            }),
        });

        if (!response.ok) {
            // Try to parse error response
            try {
                const errorData = await response.json();
                return {
                    status: 'error',
                    response: errorData.response || 'Terjadi kesalahan pada server.',
                    model: model,
                };
            } catch {
                // If parsing fails, throw to be caught below
                throw new Error(`HTTP Error: ${response.status}`);
            }
        }

        return response.json();
    } catch (error) {
        console.warn('Chat API not reachable:', error);
        return {
            status: 'error',
            response: '⚠️ **Gagal terhubung ke server.**\n\nPastikan server lokal (`npm run dev`) sedang berjalan.\n\nJika error berlanjut, cek terminal untuk detail error.',
            model: model,
        };
    }
}

// Send chat message with streaming
export async function sendChatMessageStream(
    message: string,
    history: Message[],
    model: AIModel = 'gemini',
    onChunk: (text: string) => void,
    imageData?: string,
    useSearch?: boolean,
    systemPrompt?: string
): Promise<{ fullText: string; error?: boolean }> {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                history,
                model,
                imageData,
                useSearch,
                systemPrompt,
            }),
        });

        if (!response.ok) {
            return {
                fullText: '⚠️ **Gagal terhubung ke server.**\n\nPastikan server sedang berjalan.',
                error: true,
            };
        }

        const reader = response.body?.getReader();
        if (!reader) {
            return {
                fullText: '⚠️ Stream tidak tersedia.',
                error: true,
            };
        }

        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;

                const data = trimmed.slice(6);
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.done) {
                        if (parsed.fullText) {
                            fullText = parsed.fullText;
                        }
                        return { fullText, error: parsed.error };
                    }
                    if (parsed.text) {
                        fullText += parsed.text;
                        onChunk(parsed.text);
                    }
                } catch {
                    // Skip malformed chunks
                }
            }
        }

        return { fullText };
    } catch (error) {
        console.warn('Stream API not reachable:', error);
        return {
            fullText: '⚠️ **Gagal terhubung ke server.**\n\nPastikan server lokal (`npm run dev`) sedang berjalan.',
            error: true,
        };
    }
}

// Get conversations with pagination
export async function getConversations(
    userId: string,
    limit: number = 20,
    startAfter?: string
): Promise<{ conversations: Conversation[], pagination: { nextCursor: string | null, hasMore: boolean } }> {
    try {
        let url = `${API_BASE_URL}/conversations?userId=${userId}&limit=${limit}`;
        if (startAfter) {
            url += `&startAfter=${startAfter}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-User-Id': userId,
            },
        });

        if (!response.ok) {
            console.warn('Conversations API not available');
            return { conversations: [], pagination: { nextCursor: null, hasMore: false } };
        }

        const data = await response.json();
        // Handle backward compatibility if API returns array (shouldn't happen with our recent change but good practice)
        if (Array.isArray(data.conversations)) {
            return {
                conversations: data.conversations,
                pagination: data.pagination || { nextCursor: null, hasMore: false }
            };
        }

        // Fallback for unexpected format
        return { conversations: [], pagination: { nextCursor: null, hasMore: false } };

    } catch (error) {
        console.warn('Conversations API not reachable:', error);
        return { conversations: [], pagination: { nextCursor: null, hasMore: false } };
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

// Update conversation system prompt
export async function updateConversationSystemPrompt(
    userId: string,
    conversationId: string,
    systemPrompt: string
): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                systemPrompt,
            }),
        });

        return response.ok;
    } catch (error) {
        console.warn('Update system prompt API not reachable:', error);
        return false;
    }
}

export { isApiAvailable };
