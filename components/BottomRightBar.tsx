'use client';

import { useState } from 'react';
import { MessageSquare, X, Send, Check } from 'lucide-react';
import { Dock } from '@/components/ui/dock-two';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomRightBar() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleOpenFeedback = () => {
    setIsFeedbackOpen(true);
    setIsSubmitted(false);
    setFeedback('');
    setEmail('');
  };

  const handleCloseFeedback = () => {
    setIsFeedbackOpen(false);
    setIsSubmitted(false);
    setFeedback('');
    setEmail('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: feedback.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFeedback('');
        setEmail('');
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          setIsFeedbackOpen(false);
          setIsSubmitted(false);
        }, 2000);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dockItems = [
    {
      icon: MessageSquare,
      label: 'Leave feedback',
      onClick: handleOpenFeedback,
    },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-10">
        <Dock 
          items={dockItems}
          variant="compact"
          tooltipPosition="left"
        />
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={handleCloseFeedback}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-24 right-6 z-50 w-96 rounded-lg shadow-xl bg-popover border border-border p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Thank you for your feedback!
                  </h3>
                  <p className="text-sm text-foreground/70 text-center">
                    Your message has been sent
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Leave feedback
                    </h3>
                    <button
                      onClick={handleCloseFeedback}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-foreground/70" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="feedback"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Your feedback *
                      </label>
                      <textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Share your thoughts, suggest new features, or report any issues..."
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-foreground placeholder:text-foreground/50"
                        rows={5}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Email (optional)
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-foreground placeholder:text-foreground/50"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleCloseFeedback}
                        className="flex-1 px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!feedback.trim() || isSubmitting}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-950 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

