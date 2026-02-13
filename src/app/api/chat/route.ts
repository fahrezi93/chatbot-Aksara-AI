import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface Message {
    isUser: boolean;
    text: string;
    imageData?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, history, model, imageData, useSearch } = body as {
            message: string;
            history: Message[];
            model: string;
            imageData?: string;
            useSearch?: boolean;
        };

        if (!message) {
            return NextResponse.json(
                { status: 'error', response: 'Message is required' },
                { status: 400 }
            );
        }

        let responseText: string;

        if (model === 'gemini') {
            responseText = await sendGeminiMessage(message, history, imageData, useSearch);
        } else {
            responseText = await sendOpenRouterMessage(message, history, model);
        }

        return NextResponse.json({
            status: 'success',
            response: responseText,
            model: model,
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            {
                status: 'error',
                response: 'Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.',
                model: 'unknown'
            },
            { status: 500 }
        );
    }
}

async function sendGeminiMessage(
    message: string,
    history: Message[],
    imageData?: string,
    useSearch?: boolean
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
        return '⚠️ **GEMINI_API_KEY belum dikonfigurasi.**\n\nSilakan tambahkan API key di file `.env`:\n```\nGEMINI_API_KEY=your-actual-api-key\n```\n\nDapatkan API key gratis di [Google AI Studio](https://aistudio.google.com/apikey)';
    }

    try {
        // Configure model with optional Google Search grounding
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modelOptions: any = { model: 'gemini-2.5-flash' };

        if (useSearch) {
            modelOptions.tools = [{ googleSearch: {} }];
        }

        const model = genAI.getGenerativeModel(modelOptions);

        // Convert history to Gemini format
        const chatHistory = history.map((msg) => ({
            role: msg.isUser ? 'user' : 'model',
            parts: [{ text: msg.text }],
        }));

        // Handle image if provided
        if (imageData) {
            const base64Data = imageData.split(',')[1];
            const mimeType = imageData.split(';')[0].split(':')[1];

            const result = await model.generateContent([
                { text: message },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data,
                    },
                },
            ]);

            return formatResponseWithGrounding(result);
        }

        // Start chat with history
        const chat = model.startChat({
            history: chatHistory,
        });

        const result = await chat.sendMessage(message);
        return formatResponseWithGrounding(result);
    } catch (error: unknown) {
        const err = error as { status?: number; message?: string };

        if (err.status === 429 || err.message?.includes('429') || err.message?.includes('quota')) {
            return '⚠️ **Kuota Gemini API habis.**\n\nAPI key gratis memiliki limit harian. Pilihan:\n1. Tunggu beberapa menit dan coba lagi\n2. Gunakan API key baru dari [Google AI Studio](https://aistudio.google.com/apikey)\n3. Coba gunakan model **DeepSeek** sebagai alternatif';
        }

        throw error;
    }
}

// Extract grounding metadata from Gemini response and append sources
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatResponseWithGrounding(result: GenerateContentResult | any): string {
    const text = result.response.text();

    // Try to extract grounding metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candidate = result.response.candidates?.[0] as any;
    const groundingMetadata = candidate?.groundingMetadata;

    if (!groundingMetadata) {
        return text;
    }

    // Extract source chunks
    const chunks = groundingMetadata.groundingChunks;
    if (!chunks || chunks.length === 0) {
        return text;
    }

    // Build sources section
    const sources = chunks
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((chunk: any, i: number) => `${i + 1}. [${chunk.web.title}](${chunk.web.uri})`)
        .join('\n');

    if (!sources) {
        return text;
    }

    return `${text}\n\n---\n📌 **Sumber:**\n${sources}`;
}

async function sendOpenRouterMessage(
    message: string,
    history: Message[],
    modelId: string
): Promise<string> {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const deepSeekKey = process.env.DEEPSEEK_API_KEY;

    let apiKey = deepSeekKey;
    let baseUrl = 'https://api.deepseek.com';
    let targetModel = 'deepseek-reasoner';

    // Map internal model IDs to OpenRouter model IDs
    if (openRouterKey && openRouterKey !== 'your-openrouter-api-key') {
        apiKey = openRouterKey;
        baseUrl = 'https://openrouter.ai/api/v1';

        switch (modelId) {
            case 'deepseek':
                targetModel = 'deepseek/deepseek-r1';
                break;

            case 'llama':
                targetModel = 'meta-llama/llama-3.1-405b-instruct';
                break;
            case 'qwen':
                targetModel = 'qwen/qwen-2.5-72b-instruct';
                break;
            case 'trinity':
                targetModel = 'arcee-ai/trinity-large-preview:free';
                break;
            case 'stepfun':
                targetModel = 'stepfun/step-3.5-flash:free';
                break;
            case 'glm':
                targetModel = 'z-ai/glm-4.5-air:free';
                break;

            default:
                targetModel = 'deepseek/deepseek-r1';
        }
    } else if (modelId === 'deepseek' && (!deepSeekKey || deepSeekKey === 'your-deepseek-api-key-here')) {
        return '⚠️ **API Key belum dikonfigurasi.**\n\nSilakan tambahkan `OPENROUTER_API_KEY` (rekomendasi) atau `DEEPSEEK_API_KEY` di file `.env`.';
    } else if (modelId !== 'deepseek' && !openRouterKey) {
        return '⚠️ **OpenRouter Key Diperlukan.**\n\nUntuk menggunakan model Claude, Llama, atau Qwen, Anda harus menambahkan `OPENROUTER_API_KEY` di file `.env`.';
    }

    // Convert history to OpenAI format
    const messages = history.map((msg) => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text,
    }));

    messages.push({ role: 'user', content: message });

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            // OpenRouter specific headers
            ...(openRouterKey ? {
                'HTTP-Referer': 'https://aksara-ai.my.id', // Site URL
                'X-Title': 'Aksara AI', // App Name
            } : {})
        },
        body: JSON.stringify({
            model: targetModel,
            messages: messages,
        }),
    });

    if (!response.ok) {
        if (response.status === 402) {
            return `⚠️ **Saldo ${openRouterKey ? 'OpenRouter' : 'DeepSeek'} habis.**\n\nSilakan isi ulang saldo akun Anda.`;
        }
        if (response.status === 429) {
            return '⚠️ **Rate limit tercapai.**\n\nTunggu beberapa saat dan coba lagi.';
        }
        if (response.status === 401) {
            return `⚠️ **API Key ${openRouterKey ? 'OpenRouter' : 'DeepSeek'} tidak valid.**\n\nPeriksa kembali konfigurasi API key.`;
        }
        // Try to read error message from body
        try {
            const errorData = await response.json();
            if (errorData.error?.message) {
                return `⚠️ **Error API:** ${errorData.error.message}`;
            }
        } catch { }

        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
