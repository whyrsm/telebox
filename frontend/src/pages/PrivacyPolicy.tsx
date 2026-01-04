
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';

export function PrivacyPolicyPage() {
    const lastUpdated = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent)] selection:text-white">
            {/* Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border-color)]">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="hover:opacity-80 transition-opacity">
                        <Logo />
                    </Link>
                    <Link
                        to="/"
                        className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back to Home
                    </Link>
                </div>
            </header>

            <main className="pt-32 pb-20 max-w-4xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-[var(--text-primary)]">
                        Privacy Policy
                    </h1>
                    <p className="text-[var(--text-secondary)] mb-12 text-lg">
                        Last updated: {lastUpdated}
                    </p>

                    <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none text-[var(--text-secondary)]">
                        <p className="lead text-xl text-[var(--text-primary)] mb-8">
                            Your privacy is not just a policy—it's the core of Telebox. We built Telebox to give you a beautiful interface for your files without compromising the security and privacy provided by Telegram.
                        </p>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">1. Introduction</h2>
                            <p className="mb-4">
                                Telebox ("we", "our", or "us") operates as a client interface for the Telegram API. This Privacy Policy explains how we handle your information when you use our web application.
                            </p>
                            <p>
                                By using Telebox, you acknowledge that you are also a user of Telegram and are subject to Telegram's Privacy Policy regarding the storage and transmission of your data.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">2. Data We Do Not Collect</h2>
                            <ul className="list-disc pl-6 space-y-2 mb-4">
                                <li><strong>We do not store your files.</strong> All files are uploaded directly to Telegram's cloud servers via their API.</li>
                                <li><strong>We do not see your passwords.</strong> Authentication is handled via Telegram's secure login protocols.</li>
                                <li><strong>We do not sell your data.</strong> We have no business model based on selling user data or ads.</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">3. Data We Collect & Usage</h2>
                            <p className="mb-4">
                                To function as a file manager, Telebox processes the following data locally on your device or temporarily for transmission to Telegram:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Session Data:</strong> We store a local session token to keep you logged in. This token is stored securely in your browser.</li>
                                <li><strong>Metadata:</strong> We store file names, folder structures, and file types to display them quickly in the interface. <strong>This metadata is stored in our database in an encrypted format.</strong> It is only decrypted momentarily when you access your account.</li>
                            </ul>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">4. Third-Party Services</h2>
                            <p className="mb-4">
                                <strong>Telegram:</strong> Telebox is a third-party client for Telegram. All file uploads, downloads, and storage are handled by Telegram's servers. Please review <a href="https://telegram.org/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Telegram's Privacy Policy</a> to understand how they secure your data.
                            </p>
                            <p>
                                <strong>Google Analytics:</strong> We may use basic, anonymized analytics to understand general usage patterns (e.g., number of visitors) to improve the application. We do not track individual file contents or personal identities.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">5. Security</h2>
                            <p>
                                We prioritize security by minimizing what we touch. Since we don't store your files, there is no central database of user files for us to lose or be breached. Your files are as secure as your Telegram account.
                            </p>
                            <p className="mt-4">
                                <strong>Metadata Encryption:</strong> The metadata we store (like file names) is encrypted at rest using a unique key derived from your personal session. This means we cannot read your file structure, and even in the unlikely event of a database breach, your file names remain unreadable.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">6. Open Source</h2>
                            <p>
                                Telebox is open-source software. This means anyone can inspect our code to verify that we are doing exactly what we claim—no hidden backdoors, no secret tracking. You can view our source code on <a href="https://github.com/whyrsm/telebox" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</a>.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">7. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us via our GitHub repository.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] py-12">
                <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <Logo size="sm" />
                    <div className="flex items-center gap-8 text-sm text-[var(--text-secondary)]">
                        <Link to="/privacy" className="hover:text-[var(--text-primary)] transition-colors font-medium">Privacy</Link>
                        <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Terms</a>
                        <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Contact</a>
                    </div>
                    <div className="text-sm text-[var(--text-tertiary)]">
                        &copy; {new Date().getFullYear()} Telebox. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
