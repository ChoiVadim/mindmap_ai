'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Brain, Zap, Link2, Layers, ArrowRight, X, Check } from 'lucide-react';
import { Boxes } from '@/components/ui/background-boxes';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const chatgptProblems = [
    {
      title: 'Fragmented knowledge',
      description: 'Every new chat starts from scratch. All previous insights are lost.',
    },
    {
      title: 'Manual copying',
      description: 'You have to copy pieces from old chats every time to provide context.',
    },
    {
      title: "Can't combine selectively",
      description: 'You can\'t say "use these 3 parts, but not that one".',
    },
    {
      title: 'No visual structure',
      description: 'Impossible to see connections between ideas, everything turns into a mess of text.',
    },
    {
      title: 'One-time use',
      description: 'Every prompt lives once. Impossible to reuse work structure.',
    },
  ];

  const struclyFeatures = [
    {
      icon: Brain,
      title: 'Visual structure',
      description: 'All your AI work is visible on one canvas, like a mind map',
    },
    {
      icon: Zap,
      title: 'Precise control',
      description: 'You choose which knowledge blocks AI uses for each request',
    },
    {
      icon: Link2,
      title: 'Reusability',
      description: 'Create the structure once → use it infinitely',
    },
    {
      icon: Layers,
      title: 'Connections between ideas',
      description: 'See how knowledge connects, instead of losing it in chat history',
    },
  ];

  const faqs = [
    {
      question: 'What is Strucly?',
      answer: 'Strucly is a visual knowledge management platform that combines the power of mind mapping with AI intelligence. It allows you to structure your knowledge as connected blocks on a canvas and use AI to generate context-aware responses by simply connecting relevant knowledge blocks.',
    },
    {
      question: 'How does Strucly work?',
      answer: 'You create visual blocks (notes, prompts, AI agents) on an infinite canvas and connect them with arrows. When you connect knowledge blocks to an AI block and click generate, the AI uses only the connected context to provide accurate, relevant answers. No more copying and pasting between chats!',
    },
    {
      question: 'How is this different from ChatGPT?',
      answer: 'Unlike ChatGPT where each conversation starts fresh and context is lost, Strucly lets you build reusable knowledge structures. You can visually control exactly what context the AI uses, reuse blocks across different queries, and build multi-agent workflows where AI blocks work together.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, your data is stored securely in the cloud with encryption. We use industry-standard security practices to protect your knowledge and AI interactions. You can export your data at any time.',
    },
    {
      question: 'Do I need coding skills to use Strucly?',
      answer: 'Not at all! Strucly is designed for anyone who works with AI. The visual interface is intuitive - just drag, drop, and connect blocks. No technical knowledge required.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
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
      <section className="pt-32 pb-24 px-6 lg:px-8 relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Background Boxes */}
        <div className="absolute inset-0 w-full h-full bg-background z-0 opacity-20">
          <Boxes />
        </div>
        <div className="absolute inset-0 w-full h-full bg-background/95 z-10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto w-full relative z-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-[1.1]"
              >
                ChatGPT is a calculator.{' '}
                <span className="text-primary">Strucly is your desk.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-xl md:text-2xl text-foreground/70 mb-10 max-w-2xl"
              >
                A visual canvas where you structure knowledge, connect ideas, and build AI workflows that get <span className="text-foreground font-semibold">stronger with every use.</span>
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col sm:flex-row items-start gap-4"
              >
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-lg font-medium flex items-center gap-2 group shadow-lg"
                >
                  Start for free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#comparison"
                  className="px-8 py-4 border-2 border-border rounded-lg hover:border-primary/50 transition-colors text-lg font-medium"
                >
                  See how it works
                </Link>
              </motion.div>
            </div>

            {/* Right Column - Screenshot */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative rounded-xl overflow-hidden border-2 border-border shadow-2xl">
                <Image
                  src="/images/basic_example.png"
                  alt="Strucly Canvas - Visual AI Workflow"
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="comparison" className="py-24 px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 max-w-3xl"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Why Strucly, not just ChatGPT?
            </h2>
            <p className="text-xl md:text-2xl text-foreground/70">
              ChatGPT is a powerful tool. But it has a fundamental problem: <span className="text-foreground font-semibold">it doesn't remember context between conversations.</span>
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Problems with ChatGPT */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Problems with ChatGPT</h3>
              </div>
              <div className="space-y-4">
                {chatgptProblems.map((problem, index) => (
                  <motion.div
                    key={problem.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="p-5 bg-card border border-border rounded-xl"
                  >
                    <h4 className="font-semibold text-foreground mb-2">{problem.title}</h4>
                    <p className="text-sm text-foreground/70">{problem.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* What Strucly does */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">What Strucly does</h3>
              </div>
              <div className="space-y-4">
                {struclyFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="p-5 bg-primary/5 border border-primary/20 rounded-xl hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <feature.icon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                        <p className="text-sm text-foreground/70">{feature.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 p-8 bg-primary/10 border border-primary/20 rounded-xl max-w-2xl"
          >
            <p className="text-2xl font-semibold text-foreground">
              Strucly = ChatGPT + visual memory + context control
            </p>
          </motion.div>
        </div>
      </section>

      {/* Real-life Example Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 max-w-3xl"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Real-life example: Cover Letter Generator
            </h2>
            <p className="text-xl md:text-2xl text-foreground/70">
              See how Strucly turns a repetitive task into a reusable workflow
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* With ChatGPT */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-8 bg-card border-2 border-border rounded-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-foreground/5 rounded-lg">
                  <X className="w-6 h-6 text-foreground/50" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">With ChatGPT</h3>
              </div>
              <ol className="space-y-3 text-foreground/70">
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground">1.</span>
                  <span>Open a new chat</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground">2.</span>
                  <span>Copy your resume → paste</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground">3.</span>
                  <span>Copy job description → paste</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground">4.</span>
                  <span>Write prompt: "Write a cover letter"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground">5.</span>
                  <span>A week later, forget where it was</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-red-500">6.</span>
                  <span className="text-red-500 font-semibold">For a new job — repeat everything again 😫</span>
                </li>
              </ol>
            </motion.div>

            {/* With Strucly */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-8 bg-primary/5 border-2 border-primary/20 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">With Strucly</h3>
              </div>
              <ol className="space-y-3 text-foreground/70">
                <li className="flex gap-3">
                  <span className="font-semibold text-primary">1.</span>
                  <span>Create "My Resume" block → <span className="text-foreground font-semibold">once</span></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary">2.</span>
                  <span>Create "Writing Style" block → <span className="text-foreground font-semibold">once</span></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary">3.</span>
                  <span>For EVERY new job:</span>
                </li>
                <li className="ml-8 flex gap-3">
                  <span>→</span>
                  <span>Add block with job description</span>
                </li>
                <li className="ml-8 flex gap-3">
                  <span>→</span>
                  <span>Connect it to resume and style</span>
                </li>
                <li className="ml-8 flex gap-3">
                  <span>→</span>
                  <span>Click Run → done!</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-primary">✓</span>
                  <span className="text-primary font-semibold">Everything stays in place, visible on canvas, reusable 🚀</span>
                </li>
              </ol>
            </motion.div>
          </div>

          {/* Screenshot with AI Agent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-xl overflow-hidden border-2 border-border shadow-2xl"
          >
            <Image
              src="/images/medium_example.png"
              alt="Strucly - Multi-Agent Workflow Example"
              width={1920}
              height={1080}
              className="w-full h-auto"
            />
          </motion.div>
        </div>
      </section>

      {/* Advanced Example Section */}
      <section className="py-24 px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 max-w-3xl"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Build complex AI systems visually
            </h2>
            <p className="text-xl md:text-2xl text-foreground/70">
              Chain multiple AI agents, create decision trees, and build workflows that would take hours to code
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-xl overflow-hidden border-2 border-border shadow-2xl mb-12"
          >
            <Image
              src="/images/advanced_example.png"
              alt="Strucly - Advanced Multi-Agent System"
              width={1920}
              height={1080}
              className="w-full h-auto"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Brain,
                title: 'AI Agents',
                description: 'Set behavior once with system prompts, reuse everywhere',
              },
              {
                icon: Layers,
                title: 'Knowledge Blocks',
                description: 'Build your library of reusable context and information',
              },
              {
                icon: Zap,
                title: 'Visual Workflows',
                description: 'See the entire process, debug easily, iterate fast',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="p-6 bg-card border border-border rounded-xl"
              >
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-foreground/70">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 max-w-3xl"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Who needs this?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              { icon: '🚀', text: 'AI power users — who work with prompts every day' },
              { icon: '🔬', text: 'Researchers — who gather knowledge from different sources' },
              { icon: '✍️', text: 'Writers — who create content based on multiple contexts' },
              { icon: '📊', text: 'Product managers — who structure ideas and requirements' },
              { icon: '🎓', text: 'Students — who synthesize information from multiple sources' },
              { icon: '😤', text: 'Anyone tired of losing context in endless chats' },
            ].map((item, index) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-start gap-4 p-5 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
              >
                <span className="text-3xl flex-shrink-0">{item.icon}</span>
                <p className="text-foreground">{item.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="p-8 bg-primary/10 border-2 border-primary/20 rounded-xl max-w-2xl"
          >
            <p className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Strucly is not a ChatGPT replacement.
            </p>
            <p className="text-xl text-foreground/70">
              It's what ChatGPT should become.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12 text-foreground"
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
                className="border border-border rounded-xl overflow-hidden bg-card"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors"
                >
                  <h3 className="font-semibold text-lg text-foreground pr-4">{faq.question}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-foreground/50 transition-transform flex-shrink-0 ${
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
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-foreground/70">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground"
            >
              Start building your knowledge system
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl md:text-2xl text-foreground/70 mb-10"
            >
              You're not just chatting with AI — <span className="text-foreground font-semibold">you're building a system that gets stronger with every use.</span>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <Link
                href="/signup"
                className="px-10 py-5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-lg font-semibold flex items-center gap-2 group shadow-xl"
              >
                Start for free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-2 text-sm text-foreground/60 pt-3">
                <Check className="w-4 h-4" />
                <span>No credit card required</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
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
              <p className="text-sm text-foreground/60">
                Visual AI workspace for building reusable knowledge systems
              </p>
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
          <div className="text-sm text-foreground/50 pt-8 border-t border-border">
            © 2025 Strucly. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
