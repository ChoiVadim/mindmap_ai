'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Brain, Zap, Link2, Layers, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'What is Strucly?',
      answer: 'Strucly is a visual knowledge management platform that combines the power of mind mapping with AI intelligence. It allows you to structure your knowledge as connected blocks on a canvas and use AI to generate context-aware responses by simply connecting relevant knowledge blocks.',
    },
    {
      question: 'How does Strucly work?',
      answer: 'You create visual blocks (notes, prompts, groups) on an infinite canvas and connect them with arrows. When you connect knowledge blocks to an AI block and click generate, the AI uses only the connected context to provide accurate, relevant answers. No more copying and pasting between chats!',
    },
    {
      question: 'How is this different from Notion or Miro?',
      answer: 'Unlike Notion AI which works only within a single page, or Miro which focuses on visual collaboration, Strucly is built specifically for AI-native knowledge work. You can visually orchestrate which knowledge to use for each AI query, build multi-agent workflows, and reuse knowledge blocks across different AI interactions.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, your data is stored securely in the cloud with encryption. We use industry-standard security practices to protect your knowledge and AI interactions. You can export your data at any time.',
    },
    {
      question: 'Do I need coding skills to use MindCanvas AI?',
      answer: 'Not at all! MindCanvas AI is designed for anyone who works with AI. The visual interface is intuitive - just drag, drop, and connect blocks. No technical knowledge required.',
    },
  ];

  const features = [
    {
      icon: Brain,
      title: 'AI Block',
      description: 'Connect knowledge blocks to AI and get context-aware responses instantly',
    },
    {
      icon: Link2,
      title: 'Visual Connections',
      description: 'See how your ideas relate with visual links and mind map structure',
    },
    {
      icon: Layers,
      title: 'Modular Knowledge',
      description: 'Build reusable knowledge blocks that can be combined in infinite ways',
    },
    {
      icon: Zap,
      title: 'Multi-Agent Workflows',
      description: 'Create complex AI reasoning chains with multiple connected AI blocks',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/icon.png"
              alt="Strucly Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-bold text-xl text-foreground">Strucly</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl font-bold mb-6 text-foreground"
          >
            It's not just AI.{' '}
            <span className="text-primary">It's your second brain.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto"
          >
            A visual canvas where you structure knowledge, connect ideas, and let AI think with you. 
            Plug in your knowledge blocks → Generate → Get perfect context-aware answers.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
          >
            <Link
              href="/signup"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-lg font-medium flex items-center gap-2 group"
            >
              Start thinking — it's free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm text-foreground/50"
          >
            Loved by knowledge workers building their AI-powered workflows
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground"
          >
            Everything you need to think with AI
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <feature.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-foreground/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground"
          >
            Plug-and-Think Architecture
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Create Knowledge Blocks',
                description: 'Add notes, instructions, examples, and rules as visual blocks on your canvas',
              },
              {
                step: '2',
                title: 'Connect to AI Block',
                description: 'Link the relevant knowledge blocks to an AI block with simple visual connections',
              },
              {
                step: '3',
                title: 'Generate Perfect Answers',
                description: 'AI uses only the connected context to give you accurate, relevant responses',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-foreground/70">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground"
          >
            Killer Use Cases
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Cover Letter Agent',
                description: 'Connect your resume, job description, and writing style → Get perfect cover letters',
              },
              {
                title: 'Multi-Agent Email Writer',
                description: 'Build email chains with multiple AI blocks that refine and combine responses',
              },
              {
                title: 'Research Synthesizer',
                description: 'Connect research notes from multiple sources → Get summaries, comparisons, and insights',
              },
              {
                title: 'Prompt Builder',
                description: 'Combine your prompt history, style rules, and examples → Generate perfect system prompts',
              },
            ].map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 rounded-lg bg-card border border-border"
              >
                <h3 className="text-xl font-semibold mb-2 text-foreground">{useCase.title}</h3>
                <p className="text-foreground/70">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground"
          >
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="border border-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors"
                >
                  <h3 className="font-semibold text-foreground">{faq.question}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-foreground/50 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 py-4 text-foreground/70 overflow-hidden"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-4 text-foreground"
          >
            Get started for free
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-foreground/70 mb-8"
          >
            Be organized. Be contextual. Be 10× more productive.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-lg font-medium"
            >
              Try Strucly free
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/icon.png"
                  alt="Strucly Logo"
                  width={24}
                  height={24}
                  className="rounded-lg"
                />
                <span className="font-bold text-foreground">Strucly</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li>
                  <Link href="/signup" className="hover:text-foreground transition-colors">
                    Sign up
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Log in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    AI Disclaimer
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Social</h4>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-foreground/50 pt-8 border-t border-border">
            © 2025 Strucly. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

