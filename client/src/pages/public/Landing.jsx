/**
 * Landing.jsx — Public landing page with 7 sections.
 */

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { PenLine, Coins, ClipboardList, Banknote, Lock, BarChart2, Lightbulb } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import LoanCalculator from '../../components/forms/LoanCalculator';
import PageTransition from '../../components/layout/PageTransition';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

function FadeUpSection({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  if (prefersReducedMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  );
}

const steps = [
  { Icon: PenLine, title: 'Sign Up', desc: 'Register with your details and bank account. Approval takes 1-2 business days.' },
  { Icon: Coins, title: 'Save Monthly', desc: 'Make your monthly contribution to build your savings record and eligibility.' },
  { Icon: ClipboardList, title: 'Apply for a Loan', desc: 'Once eligible, request a loan up to your multiplier limit with flexible terms.' },
  { Icon: Banknote, title: 'Receive Funds', desc: 'Approved loans are disbursed directly to your bank account within 24 hours.' },
];

const benefits = [
  { Icon: Lock, title: 'Secure Savings', desc: 'Your savings are held in a transparent, cooperative fund with full ledger visibility.' },
  { Icon: BarChart2, title: 'Flexible Loans', desc: 'Access loans based on your savings history with competitive, transparent fees.' },
  { Icon: Lightbulb, title: 'Transparent Process', desc: 'Every transaction is recorded and available for your review at any time.' },
];

const faqs = [
  { q: 'How do savings cycles work?', a: 'Each cycle runs for a fixed period set by the cooperative. Contributions are due monthly. Your record within the cycle determines your loan eligibility.' },
  { q: 'When am I eligible for a loan?', a: 'You must have made a minimum number of consecutive contributions (set by the admin) to be eligible.' },
  { q: 'How much can I borrow?', a: 'Your maximum loan is 2\u00d7 your total saved amount in the current cycle. Loan requests must be submitted before the 25th of each month.' },
  { q: 'How does repayment work?', a: 'You create a repayment schedule when applying. All loans must be fully repaid before September 30 of the current cycle.' },
  { q: 'What is the company fee?', a: 'A 10% interest rate applies on all loans. You receive 90% of the requested amount and repay 100%.' },
  { q: 'Can I get a refund of my savings?', a: 'Yes. If you have no outstanding loan, you can request a refund of your savings balance at the end of a cycle. Refunds are subject to admin approval.' },
  { q: 'When are loans disbursed?', a: 'Approved loans are disbursed on the last day of each month.' },
  { q: 'What happens if I miss payments?', a: 'Missing 2 consecutive monthly payments results in a red flag on your account and may affect your eligibility for loans and future cycles.' },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        className="w-full text-left py-4 flex items-center justify-between gap-3 font-medium text-charcoal hover:text-primary transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <span className={['transition-transform duration-200', open ? 'rotate-180' : ''].join(' ')} aria-hidden="true">▾</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={prefersReducedMotion ? {} : { height: 0, opacity: 0 }}
            animate={prefersReducedMotion ? {} : { height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? {} : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Landing() {
  const howItWorksRef = useRef(null);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <PageTransition>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary via-[#2d1133] to-[#1a0d2e] text-white py-32 px-6 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-3xl"
            animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 w-80 h-80 bg-white rounded-full blur-3xl"
            animate={{ y: [0, -40, 0], x: [0, -30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <motion.div
          className="max-w-3xl mx-auto text-center relative z-10"
          variants={staggerContainer}
          initial={prefersReducedMotion ? 'visible' : 'hidden'}
          animate="visible"
        >
          <motion.h1
            variants={staggerItem}
            className="font-heading text-4xl md:text-6xl font-bold leading-tight"
          >
            Your Trusted Savings &amp; Loan Cooperative
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="mt-6 text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed"
          >
            Save monthly, build eligibility, and access fair loans — all within a transparent,
            member-first cooperative.
          </motion.p>
          <motion.div variants={staggerItem} className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link to="/signup">
              <motion.button
                className="btn-primary bg-accent text-white px-10 py-4 rounded-xl font-semibold text-lg hover:shadow-hover"
                whileHover={prefersReducedMotion ? {} : { y: -2, scale: 1.02 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
              >
                Join Now
              </motion.button>
            </Link>
            <motion.button
              className="btn-secondary border-2 border-white/50 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 backdrop-blur-sm"
              onClick={scrollToHowItWorks}
              whileHover={prefersReducedMotion ? {} : { y: -2, scale: 1.02 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
            >
              Learn More
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Wave divider at bottom */}
        <div className="absolute bottom-0 left-0 w-full" aria-hidden="true">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 md:h-24">
            <path d="M0,0 C150,60 350,0 600,50 C850,100 1050,40 1200,60 L1200,120 L0,120 Z" fill="#F5F3FF" />
          </svg>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section ref={howItWorksRef} id="how-it-works" className="py-20 px-6 bg-background">
        <FadeUpSection className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-primary text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <FadeUpSection key={i}>
                <div className="card-base text-center hover:shadow-hover transition-shadow">
                  <step.Icon size={40} className="mx-auto mb-3 text-accent" aria-hidden="true" />
                  <h3 className="font-heading font-bold text-primary mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </FadeUpSection>
            ))}
          </div>
        </FadeUpSection>
      </section>

      {/* ── Benefits ─────────────────────────────────────── */}
      <section className="py-20 px-6 bg-sectionBg">
        <FadeUpSection className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-primary text-center mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <FadeUpSection key={i}>
                <div className="card-base text-center hover:shadow-hover transition-shadow">
                  <b.Icon size={40} className="mx-auto mb-3 text-accent" aria-hidden="true" />
                  <h3 className="font-heading font-bold text-primary mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              </FadeUpSection>
            ))}
          </div>
        </FadeUpSection>
      </section>

      {/* ── Loan Calculator ──────────────────────────────── */}
      <section className="py-20 px-6 bg-background">
        <FadeUpSection className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-primary text-center mb-3">
            See Your Loan Breakdown
          </h2>
          <p className="text-center text-sm text-gray-500 mb-8">
            Your maximum loan is 2&times; your total saved amount. A 10% fee applies &mdash; you receive 90% of the requested amount and repay 100%.
          </p>
          <LoanCalculator />
        </FadeUpSection>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-sectionBg">
        <FadeUpSection className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-primary text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="card-base">
            {faqs.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </FadeUpSection>
      </section>

      {/* ── CTA Banner ───────────────────────────────────── */}
      <section className="py-20 px-6 bg-primary text-white text-center">
        <FadeUpSection>
          <h2 className="font-heading text-3xl font-bold mb-4">Ready to Start Saving?</h2>
          <p className="text-white/70 mb-8 max-w-md mx-auto">
            Join hundreds of members already building their financial future with Oma Midas Global.
          </p>
          <Link to="/signup">
            <motion.button
              className="bg-accent text-white px-10 py-3.5 rounded-xl font-semibold text-lg hover:shadow-hover"
              whileHover={prefersReducedMotion ? {} : { y: -2 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
            >
              Join Now — It's Free
            </motion.button>
          </Link>
        </FadeUpSection>
      </section>

      <Footer />
    </PageTransition>
  );
}
