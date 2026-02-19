import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
            return new Response(
                JSON.stringify({ error: 'Message is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    if (model === 'gemini') {
                        await streamGemini(controller, encoder, message, history, imageData, useSearch);
                    } else {
                        await streamOpenRouter(controller, encoder, message, history, model);
                    }
                } catch (error) {
                    console.error('Stream error:', error);
                    const errorChunk = JSON.stringify({
                        text: '\n\n⚠️ Terjadi kesalahan saat streaming. Silakan coba lagi.',
                        done: true,
                        error: true,
                    });
                    controller.enqueue(encoder.encode(`data: ${errorChunk}\n\n`));
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Stream API error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

async function streamGemini(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    message: string,
    history: Message[],
    imageData?: string,
    useSearch?: boolean
) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
        const errorText = '⚠️ **GEMINI_API_KEY belum dikonfigurasi.**\n\nSilakan tambahkan API key di file `.env`:\n```\nGEMINI_API_KEY=your-actual-api-key\n```\n\nDapatkan API key gratis di [Google AI Studio](https://aistudio.google.com/apikey)';
        const chunk = JSON.stringify({ text: errorText, done: true });
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        controller.close();
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelOptions: any = { model: 'gemini-2.5-flash' };

    if (useSearch) {
        modelOptions.tools = [{ googleSearch: {} }];
    }

    const geminiModel = genAI.getGenerativeModel(modelOptions);

    // Convert history to Gemini format
    const chatHistory = history.map((msg) => ({
        role: msg.isUser ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));

    let fullText = '';

    if (imageData) {
        // Image handling - stream with image
        const base64Data = imageData.split(',')[1];
        const mimeType = imageData.split(';')[0].split(':')[1];

        const result = await geminiModel.generateContentStream([
            { text: message },
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                },
            },
        ]);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                fullText += chunkText;
                const data = JSON.stringify({ text: chunkText, done: false });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
        }

        // Check for grounding in aggregated response
        const response = await result.response;
        const groundingSuffix = extractGroundingSuffix(response);
        if (groundingSuffix) {
            fullText += groundingSuffix;
            const data = JSON.stringify({ text: groundingSuffix, done: false });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
    } else {
        // Text-only chat with history - stream
        const chat = geminiModel.startChat({ history: chatHistory });
        const result = await chat.sendMessageStream(message);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                fullText += chunkText;
                const data = JSON.stringify({ text: chunkText, done: false });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
        }

        // Check for grounding in aggregated response
        const response = await result.response;
        const groundingSuffix = extractGroundingSuffix(response);
        if (groundingSuffix) {
            fullText += groundingSuffix;
            const data = JSON.stringify({ text: groundingSuffix, done: false });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
    }

    // Send done signal
    const doneChunk = JSON.stringify({ text: '', done: true, fullText });
    controller.enqueue(encoder.encode(`data: ${doneChunk}\n\n`));
    controller.close();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractGroundingSuffix(response: any): string | null {
    try {
        const candidate = response.candidates?.[0];
        const groundingMetadata = candidate?.groundingMetadata;

        if (!groundingMetadata) return null;

        const chunks = groundingMetadata.groundingChunks;
        if (!chunks || chunks.length === 0) return null;

        const sources = chunks
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((chunk: any, i: number) => `${i + 1}. [${chunk.web.title}](${chunk.web.uri})`)
            .join('\n');

        if (!sources) return null;

        return `\n\n---\n📌 **Sumber:**\n${sources}`;
    } catch {
        return null;
    }
}

async function streamOpenRouter(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    message: string,
    history: Message[],
    modelId: string
) {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const deepSeekKey = process.env.DEEPSEEK_API_KEY;

    let apiKey = deepSeekKey;
    let baseUrl = 'https://api.deepseek.com';
    let targetModel = 'deepseek-reasoner';

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
        const errorText = '⚠️ **API Key belum dikonfigurasi.**\n\nSilakan tambahkan `OPENROUTER_API_KEY` (rekomendasi) atau `DEEPSEEK_API_KEY` di file `.env`.';
        const chunk = JSON.stringify({ text: errorText, done: true });
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        controller.close();
        return;
    } else if (modelId !== 'deepseek' && !openRouterKey) {
        const errorText = '⚠️ **OpenRouter Key Diperlukan.**\n\nUntuk menggunakan model ini, Anda harus menambahkan `OPENROUTER_API_KEY` di file `.env`.';
        const chunk = JSON.stringify({ text: errorText, done: true });
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        controller.close();
        return;
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
            ...(openRouterKey ? {
                'HTTP-Referer': 'https://aksara-ai.my.id',
                'X-Title': 'Aksara AI',
            } : {})
        },
        body: JSON.stringify({
            model: targetModel,
            messages: messages,
            stream: true,
        }),
    });

    if (!response.ok) {
        let errorText = '⚠️ Terjadi kesalahan pada API.';
        if (response.status === 402) {
            errorText = `⚠️ **Saldo ${openRouterKey ? 'OpenRouter' : 'DeepSeek'} habis.**\n\nSilakan isi ulang saldo akun Anda.`;
        } else if (response.status === 429) {
            errorText = '⚠️ **Rate limit tercapai.**\n\nTunggu beberapa saat dan coba lagi.';
        } else if (response.status === 401) {
            errorText = `⚠️ **API Key ${openRouterKey ? 'OpenRouter' : 'DeepSeek'} tidak valid.**\n\nPeriksa kembali konfigurasi API key.`;
        } else {
            try {
                const errorData = await response.json();
                if (errorData.error?.message) {
                    errorText = `⚠️ **Error API:** ${errorData.error.message}`;
                }
            } catch { }
        }
        const chunk = JSON.stringify({ text: errorText, done: true });
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        controller.close();
        return;
    }

    // Parse SSE stream from OpenRouter/DeepSeek
    const reader = response.body?.getReader();
    if (!reader) {
        const chunk = JSON.stringify({ text: '⚠️ Stream tidak tersedia.', done: true });
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        controller.close();
        return;
    }

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            const lines = buffer.split('\n');
            // Keep the last potentially incomplete line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;

                const data = trimmed.slice(6); // Remove 'data: '
                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                        fullText += content;
                        const chunk = JSON.stringify({ text: content, done: false });
                        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
                    }
                } catch {
                    // Skip malformed JSON chunks
                }
            }
        }
    } finally {
        reader.releaseLock();
    }

    // Send done signal
    const doneChunk = JSON.stringify({ text: '', done: true, fullText });
    controller.enqueue(encoder.encode(`data: ${doneChunk}\n\n`));
    controller.close();
}
