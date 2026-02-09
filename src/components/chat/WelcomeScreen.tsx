'use client';

interface WelcomeScreenProps {
    userName: string;
}

const suggestions = [
    {
        icon: (
            <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
        title: 'Jelaskan konsep',
        prompt: 'Jelaskan konsep machine learning dengan bahasa yang mudah dipahami',
        color: 'from-sky-500 to-blue-500',
    },
    {
        icon: (
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
        title: 'Bantu menulis',
        prompt: 'Bantu saya menulis email profesional untuk melamar pekerjaan',
        color: 'from-blue-500 to-indigo-500',
    },
    {
        icon: (
            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        ),
        title: 'Debug kode',
        prompt: 'Bantu saya debug kode Python yang error',
        color: 'from-indigo-500 to-violet-500',
    },
    {
        icon: (
            <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        title: 'Ide kreatif',
        prompt: 'Berikan ide kreatif untuk konten media sosial bisnis kuliner',
        color: 'from-cyan-500 to-blue-500',
    },
];

export default function WelcomeScreen({ userName }: WelcomeScreenProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
            {/* Logo */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/20 animate-float">
                <span className="text-white font-bold text-4xl">A</span>
            </div>

            {/* Greeting */}
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                Hi {userName},
            </h1>
            <h2 className="text-xl sm:text-2xl font-medium text-[var(--text-secondary)] mb-8">
                Apa yang bisa saya bantu hari ini?
            </h2>

            {/* Suggestions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        className="group relative overflow-hidden p-5 rounded-2xl glass-card text-left transition-all hover:shadow-lg"
                    >
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${suggestion.color} transition-opacity duration-300`} />
                        <div className="relative z-10 flex items-start gap-4">
                            <span className="p-2 rounded-xl bg-white dark:bg-white/10 shadow-sm">{suggestion.icon}</span>
                            <div>
                                <h3 className="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {suggestion.title}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                    {suggestion.prompt}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
