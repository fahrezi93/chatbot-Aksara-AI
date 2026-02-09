'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface WelcomeScreenProps {
    userName: string;
    onPromptSelect: (prompt: string) => void;
}


const ALL_PROMPTS = [
    {
        title: "Resep Kue Lebaran",
        subtitle: "10 Resep kue lebaran praktis dan murah",
        full_prompt: "Berikan 10 resep kue lebaran yang praktis dan murah",
    },
    {
        title: "Ide Konten TikTok",
        subtitle: "Konten TikTok yang lagi viral sekarang",
        full_prompt: "Berikan ide konten TikTok yang sedang viral saat ini",
    },
    {
        title: "Rekomendasi Film",
        subtitle: "Genre Film Action Indonesia",
        full_prompt: "Rekomendasikan film action dari Indonesia",
    },
    {
        title: "Buat Draf Email",
        subtitle: "untuk menindaklanjuti proposal kerjasama",
        full_prompt:
            "Buatkan saya draf email profesional untuk menindaklanjuti proposal kerjasama yang saya kirim minggu lalu.",
    },
    {
        title: "Rangkum Teks Ini",
        subtitle: "menjadi 5 poin utama",
        full_prompt:
            "Tolong rangkum teks berikut menjadi 5 poin utama: [tempel teks di sini]",
    },
    {
        title: "Ide Nama Brand",
        subtitle: "untuk produk fashion ramah lingkungan",
        full_prompt:
            "Berikan 10 ide nama brand yang menarik untuk produk fashion yang ramah lingkungan.",
    },
    {
        title: "Latihan Wawancara Kerja",
        subtitle: "untuk posisi Digital Marketing",
        full_prompt:
            "Mari kita latihan wawancara kerja. Ajukan saya pertanyaan umum untuk posisi Digital Marketing.",
    },
    {
        title: "Buat Jadwal Mingguan",
        subtitle: "untuk menyeimbangkan kerja dan olahraga",
        full_prompt:
            "Buatkan saya contoh jadwal mingguan yang seimbang antara pekerjaan full-time dan rutinitas olahraga 3 kali seminggu.",
    },
    {
        title: "Jelaskan Konsep Sulit",
        subtitle: "seperti menjelaskan kepada anak 10 tahun",
        full_prompt:
            "Jelaskan konsep 'blockchain' seolah-olah saya adalah anak berusia 10 tahun.",
    },
    {
        title: "Buat Puisi",
        subtitle: "tentang senja di tepi pantai",
        full_prompt:
            "Buatkan saya sebuah puisi singkat tentang indahnya senja di tepi pantai.",
    },
    {
        title: "Rencana Perjalanan",
        subtitle: "ke Yogyakarta selama 3 hari 2 malam",
        full_prompt:
            "Buatkan rencana perjalanan (itinerary) hemat untuk liburan ke Yogyakarta selama 3 hari 2 malam.",
    },
    {
        title: "Terjemahkan & Perbaiki",
        subtitle: "kalimat bahasa Inggris ini",
        full_prompt:
            "Terjemahkan kalimat ini ke Bahasa Inggris dan perbaiki grammarnya: 'Saya suka makan nasi goreng dan saya pikir itu adalah makanan terbaik di dunia.'",
    },
    {
        title: "Ide Hadiah Ulang Tahun",
        subtitle: "untuk sahabat perempuan budget 200 ribu",
        full_prompt:
            "Berikan 5 ide hadiah ulang tahun yang unik untuk sahabat perempuan dengan budget di bawah 200 ribu rupiah.",
    },
    {
        title: "Tulis Caption Instagram",
        subtitle: "untuk foto liburan di gunung",
        full_prompt:
            "Buatkan 3 pilihan caption Instagram yang menarik untuk foto liburan di gunung.",
    },
    {
        title: "Analisis SWOT Sederhana",
        subtitle: "untuk bisnis kedai kopi kecil",
        full_prompt:
            "Lakukan analisis SWOT (Strengths, Weaknesses, Opportunities, Threats) sederhana untuk bisnis kedai kopi kecil di lingkungan perumahan.",
    },
    {
        title: "Buat Cerita Pendek",
        subtitle: "dengan 3 kata kunci: kucing, malam, misteri",
        full_prompt:
            "Buat sebuah cerita pendek (sekitar 200 kata) yang mengandung kata kunci: kucing, malam, dan misteri.",
    },
    {
        title: "Ide Menu Sarapan Sehat",
        subtitle: "selama satu minggu",
        full_prompt: "Berikan ide menu sarapan sehat dan praktis untuk 7 hari.",
    },
    {
        title: "Bandingkan Dua Produk",
        subtitle: "iPhone 15 vs Samsung S24",
        full_prompt:
            "Bandingkan kelebihan dan kekurangan antara iPhone 15 dan Samsung Galaxy S24 dalam bentuk tabel.",
    },
    {
        title: "Buat Script Video Pendek",
        subtitle: "tentang tips menabung untuk pemula",
        full_prompt:
            "Buatkan script singkat untuk video Reels/Shorts berdurasi 30 detik tentang tips menabung untuk pemula.",
    },
    {
        title: "Jelaskan Istilah Coding",
        subtitle: "apa itu API?",
        full_prompt:
            "Jelaskan apa itu API (Application Programming Interface) dengan analogi yang mudah dipahami oleh orang non-teknis.",
    },
    {
        title: "Konversi Resep",
        subtitle: "dari 4 porsi menjadi 8 porsi",
        full_prompt:
            "Saya punya resep bolu untuk 4 porsi. Tolong konversikan semua takarannya agar bisa dibuat untuk 8 porsi.",
    },
    {
        title: "Tips Belajar Efektif",
        subtitle: "untuk persiapan ujian",
        full_prompt:
            "Berikan 7 tips belajar yang efektif untuk persiapan menghadapi ujian.",
    },
    {
        title: "Buat Dialog",
        subtitle: "antara penjual dan pembeli di pasar",
        full_prompt:
            "Buatkan contoh dialog tawar-menawar antara penjual buah dan pembeli di pasar tradisional.",
    },
    {
        title: "Rekomendasi Buku",
        subtitle: "novel fiksi ilmiah untuk pemula",
        full_prompt:
            "Rekomendasikan 3 buku novel fiksi ilmiah yang bagus untuk pembaca pemula di genre ini.",
    },
    {
        title: "Ide Dekorasi Kamar",
        subtitle: "dengan gaya minimalis dan budget terbatas",
        full_prompt:
            "Berikan ide-ide dekorasi kamar tidur dengan gaya minimalis yang tidak memakan banyak biaya.",
    },
    {
        title: "Buat Slogan Iklan",
        subtitle: "untuk produk minuman energi herbal",
        full_prompt:
            "Buatkan 5 pilihan slogan iklan yang catchy untuk produk minuman energi dari bahan herbal.",
    },
    {
        title: "Latihan Soal Matematika",
        subtitle: "untuk tingkat SMP",
        full_prompt:
            "Berikan 5 soal latihan matematika tentang aljabar sederhana untuk siswa SMP beserta jawabannya.",
    },
    {
        title: "Analisis Puisi",
        subtitle: "karya Chairil Anwar 'Aku'",
        full_prompt:
            "Berikan analisis singkat mengenai makna dari puisi 'Aku' karya Chairil Anwar.",
    },
    {
        title: "Jelaskan Peribahasa",
        subtitle: "arti dari 'Air susu dibalas dengan air tuba'",
        full_prompt:
            "Apa arti dari peribahasa 'Air susu dibalas dengan air tuba' dan berikan contoh penggunaannya dalam kalimat.",
    },
    {
        title: "Rekomendasi Channel YouTube",
        subtitle: "untuk belajar tentang sejarah Indonesia",
        full_prompt:
            "Rekomendasikan beberapa channel YouTube yang bagus untuk belajar tentang sejarah Indonesia.",
    },
];

const GRADIENTS = [
    'from-sky-500 to-blue-500',
    'from-blue-500 to-indigo-500',
    'from-indigo-500 to-violet-500',
    'from-cyan-500 to-blue-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-500',
    'from-fuchsia-500 to-purple-500',
];

const ICONS = [
    (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
    ),
    (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    ),
    (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
    ),
    (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 3-2 3 2zm0 0v-8" />
        </svg>
    ),
    (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    )
];

export default function WelcomeScreen({ userName, onPromptSelect }: WelcomeScreenProps) {
    const [displayPrompts, setDisplayPrompts] = useState<{
        title: string;
        subtitle: string;
        full_prompt: string;
        color: string;
        icon: React.ReactNode;
    }[]>([]);

    const getRandomPrompts = () => {
        // Randomly select 6 prompts
        const shuffledPrompts = [...ALL_PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 6);

        // Map them to include random colors and icons
        return shuffledPrompts.map((prompt, index) => ({
            ...prompt,
            color: GRADIENTS[index % GRADIENTS.length],
            icon: ICONS[index % ICONS.length]
        }));
    };

    useEffect(() => {
        setDisplayPrompts(getRandomPrompts());
    }, []);

    const handleRefresh = () => {
        setDisplayPrompts(getRandomPrompts());
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
            {/* Logo */}
            <div className="w-24 h-24 relative mb-6 animate-float">
                <Image
                    src="/Aksara-AI-Logo-Warna.png"
                    alt="Aksara AI Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            {/* Greeting */}
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                Hi {userName},
            </h1>
            <h2 className="text-xl sm:text-2xl font-medium text-[var(--text-secondary)] mb-8">
                Apa yang bisa saya bantu hari ini?
            </h2>

            {/* Guest CTA */}
            {userName === 'Guest' && (
                <div className="mt-4 p-8 rounded-3xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 max-w-2xl w-full backdrop-blur-sm shadow-xl shadow-blue-500/5 transition-all hover:shadow-blue-500/10 mb-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400 mb-6">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Dapatkan Pengalaman Penuh
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-md mx-auto">
                        Masuk untuk menyimpan riwayat chat, mencoba model AI terbaru, dan fitur premium lainnya secara gratis.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                            Daftar Gratis
                        </Link>
                        <Link
                            href="/login"
                            className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-gray-700 rounded-xl font-bold transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                            Masuk Akun
                        </Link>
                    </div>
                </div>
            )}

            {/* Suggestions Grid */}
            {userName !== 'Guest' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
                        {displayPrompts.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onPromptSelect(suggestion.full_prompt)}
                                className="group relative overflow-hidden p-5 rounded-2xl glass-card text-left transition-all hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${suggestion.color} transition-opacity duration-300`} />
                                <div className="relative z-10 flex items-start gap-4">
                                    <span className={`p-2 rounded-xl bg-white dark:bg-white/10 shadow-sm text-${suggestion.color.split(' ')[0].replace('from-', '')}`}>
                                        {suggestion.icon}
                                    </span>
                                    <div>
                                        <h3 className="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {suggestion.title}
                                        </h3>
                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                            {suggestion.subtitle}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleRefresh}
                        className="mt-8 flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors group"
                    >
                        <svg className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Acak Rekomendasi
                    </button>
                </>
            )}
        </div>
    );
}
