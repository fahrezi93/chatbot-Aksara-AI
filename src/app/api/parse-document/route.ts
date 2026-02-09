import { NextRequest, NextResponse } from 'next/server';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';

        if (file.type === 'application/pdf') {
            try {
                // Load the PDF document
                // Convert Buffer to Uint8Array for pdfjs
                const uint8Array = new Uint8Array(buffer);
                const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
                const doc = await loadingTask.promise;

                const numPages = doc.numPages;
                const textContent: string[] = [];

                // Extract text from each page
                for (let i = 1; i <= numPages; i++) {
                    const page = await doc.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items
                        .map((item: any) => item.str)
                        .join(' ');
                    textContent.push(pageText);
                }

                text = textContent.join('\n\n');
            } catch (e) {
                console.error('PDF Parse Error:', e);
                return NextResponse.json(
                    { error: 'Failed to read PDF file' },
                    { status: 500 }
                );
            }
        } else if (file.type === 'text/plain') {
            text = buffer.toString('utf-8');
        } else {
            return NextResponse.json(
                { error: 'Unsupported file type. Please upload PDF or TXT files.' },
                { status: 400 }
            );
        }

        // Clean up text
        text = text
            .replace(/\r\n/g, '\n')
            .replace(/\t/g, ' ')
            .replace(/ +/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();

        return NextResponse.json({ text });
    } catch (error) {
        console.error('Error parsing document:', error);
        return NextResponse.json(
            { error: 'Failed to process document' },
            { status: 500 }
        );
    }
}
