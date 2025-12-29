
import { Link } from 'react-router-dom';
import {
  Cloud,
  Shield,
  FolderOpen,
  ArrowRight,
  Upload,
  Smartphone,
  Menu,
  X,
  Check,
  Users,
  Link as LinkIcon,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent)] selection:text-white">
      {/* Navbar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "bg-white/80 backdrop-blur-md border-b border-[var(--border-color)]" : "bg-transparent"
        )}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</a>
            <a href="#how-it-works" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">How it Works</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-[var(--text-primary)] text-[var(--text-secondary)] transition-colors">
              Log in
            </Link>
            <Link
              to="/login"
              className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-[var(--text-primary)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white border-b border-[var(--border-color)] overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium">Features</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium">Pricing</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium">How it Works</a>
              <hr className="border-[var(--border-color)]" />
              <Link to="/login" className="text-sm font-medium">Log in</Link>
              <Link to="/login" className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium text-center">Get Started</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-6 text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[var(--border-color)] shadow-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Powered by Telegram</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-[var(--text-primary)] leading-[1.1]">
              Unlimited Free Storage.<br className="hidden md:block" />
              <span className="text-[var(--text-secondary)]">Private. Simple.</span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 leading-relaxed">
              Unlimited storage powered by Telegram. <br className="hidden md:block" />
              No more deleting photos or "upgrade for more storage" emails.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
              <Link
                to="/login"
                className="bg-black text-white h-12 px-8 rounded-md font-medium text-base hover:bg-neutral-800 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 shadow-lg shadow-black/5"
              >
                Get Started Free
                <ArrowRight size={18} />
              </Link>
              <a
                href="#how-it-works"
                className="bg-transparent hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] h-12 px-8 rounded-md font-medium text-base transition-colors flex items-center border border-transparent hover:border-[var(--border-color)]"
              >
                How It Works
              </a>
            </div>

            {/* Architecture Visual in Hero */}
            <div className="relative max-w-4xl mx-auto mt-16">
              <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-8 md:p-12 overflow-hidden relative">
                <div className="text-center mb-12">
                  <h3 className="text-lg font-semibold mb-2">No Middlemen. Just You and Telegram.</h3>
                  <p className="text-sm text-[var(--text-secondary)]">We don't store your files on our servers. We just help you manage them.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 relative z-10 max-w-3xl mx-auto">

                  {/* Telebox Side */}
                  <div className="w-full md:w-1/3 bg-white rounded-xl border border-[var(--border-color)] p-6 shadow-sm text-center relative z-20">
                    <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/10">
                      <Cloud size={24} fill="currentColor" />
                    </div>
                    <h4 className="font-semibold mb-1">Telebox</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Your beautiful interface to organize folders and files.
                    </p>
                  </div>

                  {/* Connection Animation */}
                  <div className="flex-1 flex flex-row md:flex-col items-center justify-center relative w-full h-12 md:h-24">
                    {/* Horizontal Line for Desktop */}
                    <div className="hidden md:block w-full h-[2px] bg-[var(--border-strong)] relative rounded-full overflow-hidden">
                      <div className="absolute inset-0 bg-repeating-linear-gradient-to-r from-transparent via-[var(--border-color)] to-transparent w-full h-full" />

                      {/* Packets moving right (Upload) */}
                      <motion.div
                        className="absolute top-0 bottom-0 w-8 bg-black/80 rounded-full"
                        animate={{ x: ["-100%", "400%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                      {/* Packets moving left (Download) */}
                      <motion.div
                        className="absolute top-0 bottom-0 w-8 bg-[#229ED9] rounded-full"
                        animate={{ x: ["400%", "-100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.75 }}
                      />
                    </div>

                    {/* Vertical Line for Mobile */}
                    <div className="md:hidden h-full w-[2px] bg-[var(--border-strong)] relative rounded-full overflow-hidden my-4">
                      <motion.div
                        className="absolute left-0 right-0 h-4 bg-black/80 rounded-full"
                        animate={{ y: ["-100%", "400%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>

                    <div className="absolute bg-[var(--bg-secondary)] px-3 py-1 text-[10px] font-mono text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-full z-10">
                      TELEGRAM API
                    </div>
                  </div>

                  {/* Telegram Side */}
                  <div className="w-full md:w-1/3 bg-white border border-[#229ED9]/20 p-6 rounded-xl shadow-sm text-center relative z-20">
                    <img src="/telegram_logo.svg" alt="Telegram" className="w-12 h-12 mx-auto mb-4" />
                    <h4 className="font-semibold mb-1">Telegram Cloud</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Unlimited storage. Encrypted by Telegram.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="max-w-5xl mx-auto px-6 mb-32">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need</h2>
            <p className="text-[var(--text-secondary)]">Powerful features wrapped in a simple interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Unlimited */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl border border-[var(--border-color)] p-8 shadow-sm hover:shadow-md transition-all group flex flex-col"
            >
              <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center mb-6 text-black">
                <Cloud size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Unlimited & Free</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Leveraging Telegram's API, we offer true unlimited cloud storage for all your files. No caps, no tiers.
              </p>
            </motion.div>

            {/* Card 2: Private */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl border border-[var(--border-color)] p-8 shadow-sm hover:shadow-md transition-all group flex flex-col"
            >
              <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center mb-6 text-black">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Private by Design</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Your files are stored in your own Telegram "Saved Messages". We act as a bridge, we don't spy.
              </p>
            </motion.div>

            {/* Card 3: Organization */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl border border-[var(--border-color)] p-8 shadow-sm hover:shadow-md transition-all group flex flex-col"
            >
              <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center mb-6 text-black">
                <FolderOpen size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Organization</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Folders, subfolders, and easy file management just like your computer's finder or explorer.
              </p>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="max-w-4xl mx-auto px-6 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">How it works</h2>
            <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
              Your Telegram account is already an unlimited cloud. We just give it a proper interface.
            </p>
          </div>

          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-[2px] border-l-2 border-dotted border-[var(--border-color)] md:left-1/2 md:-ml-[1px]" />

            <div className="space-y-16">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative flex items-center gap-8 md:justify-center"
              >
                <div className="md:w-1/2 md:text-right hidden md:block pr-12">
                  <h3 className="text-xl font-semibold mb-2">Connect your Telegram</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Log in securely with your phone number. We use your Telegram account as your personal unlimited storage drive.
                  </p>
                </div>

                <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full bg-white border border-[var(--border-color)] flex items-center justify-center shadow-sm text-black font-bold text-lg">
                  1
                </div>

                <div className="md:w-1/2 md:hidden">
                  <h3 className="text-xl font-semibold mb-2">Connect your Telegram</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Log in securely. We use your Telegram account as your personal unlimited storage drive.
                  </p>
                </div>

                <div className="hidden md:block md:w-1/2 pl-12">
                  <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
                    <Smartphone size={32} className="text-[var(--text-primary)]" />
                  </div>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative flex items-center gap-8 md:justify-center"
              >
                <div className="hidden md:block md:w-1/2 pr-12">
                  <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center ml-auto transform -rotate-3 hover:-rotate-6 transition-transform">
                    <Upload size={32} className="text-[var(--text-primary)]" />
                  </div>
                </div>

                <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full bg-white border border-[var(--border-color)] flex items-center justify-center shadow-sm text-black font-bold text-lg">
                  2
                </div>

                <div className="md:w-1/2 md:pl-12">
                  <h3 className="text-xl font-semibold mb-2">Upload to 'Saved Messages'</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    When you upload a file here, it's instantly forwarded to your private "Saved Messages" chat on Telegram.
                  </p>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative flex items-center gap-8 md:justify-center"
              >
                <div className="md:w-1/2 md:text-right hidden md:block pr-12">
                  <h3 className="text-xl font-semibold mb-2">Organize & Access</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    We index those files so you can browse them like a real drive with folders, search, and previews.
                  </p>
                </div>

                <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full bg-black border border-black flex items-center justify-center shadow-md text-white font-bold text-lg">
                  3
                </div>

                <div className="md:w-1/2 md:hidden">
                  <h3 className="text-xl font-semibold mb-2">Organize & Access</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    We index those files so you can browse them like a real drive with folders, search, and previews.
                  </p>
                </div>

                <div className="hidden md:block md:w-1/2 pl-12">
                  <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
                    <FolderOpen size={32} className="text-[var(--text-primary)]" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>


        {/* Pricing Section */}
        <section id="pricing" className="max-w-5xl mx-auto px-6 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
            <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
              Unlimited storage for everyone. Upgrade when you need to share.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl border border-[var(--border-color)] p-8 shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Personal Free</h3>
                <p className="text-[var(--text-secondary)] text-sm">Perfect for personal use</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-[var(--text-secondary)]"> / forever</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited files & folders</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">File preview (images, videos, docs)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Drag & drop uploads</span>
                </li>
              </ul>

              <Link
                to="/login"
                className="w-full bg-black text-white py-3 rounded-lg font-medium text-center hover:bg-neutral-800 transition-colors"
              >
                Get Started Free
              </Link>
            </motion.div>

            {/* Plus Plan */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl border-2 border-black p-8 shadow-sm hover:shadow-md transition-all flex flex-col relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-medium px-3 py-1 rounded-full">
                Coming Soon
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Personal Plus</h3>
                <p className="text-[var(--text-secondary)] text-sm">Share & collaborate with others</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$12</span>
                  <span className="text-lg text-[var(--text-tertiary)] line-through">$20</span>
                  <span className="text-[var(--text-secondary)]">/ year</span>
                </div>
                <span className="text-xs text-green-600 font-medium">40% off launch discount</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Everything in Free, plus:</span>
                </li>
                <li className="flex items-start gap-3">
                  <Upload size={20} className="text-black flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Import from Telegram chats</span>
                </li>
                <li className="flex items-start gap-3">
                  <LinkIcon size={20} className="text-black flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Private sharing links</span>
                </li>
                <li className="flex items-start gap-3">
                  <Lock size={20} className="text-black flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Password protection & expiring links</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users size={20} className="text-black flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Shared folders (up to 10 collaborators)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield size={20} className="text-black flex-shrink-0 mt-0.5" />
                  <span className="text-sm">View-only & edit access controls</span>
                </li>
              </ul>

              <button
                disabled
                className="w-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] py-3 rounded-lg font-medium text-center cursor-not-allowed"
              >
                Coming Soon
              </button>
            </motion.div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-6 py-20 bg-white border-y border-[var(--border-color)]">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-[var(--text-primary)]">
              Ready to free your files?
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">
              No sign-up fees, no storage limits. Just connect and start uploading.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-black rounded-md hover:bg-neutral-800 transition-colors shadow-sm"
            >
              Get Started for Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo size="sm" />

          <div className="flex items-center gap-8 text-sm text-[var(--text-secondary)]">
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Privacy</a>
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
