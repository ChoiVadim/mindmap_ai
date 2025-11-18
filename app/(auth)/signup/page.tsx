'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SignUpPage, Testimonial } from '@/components/ui/sign-up';

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Strucly changed how I work with AI. No more lost context in chat history — everything is visual and reusable."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "I built a cover letter generator in 5 minutes. Resume + job posting + my style = perfect letters every time."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces",
    name: "David Martinez",
    handle: "@davidcreates",
    text: "Finally, a tool that lets me control exactly what context the AI uses. Game changer for complex projects."
  },
];

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      router.push('/');
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });

      if (error) throw error;
      // OAuth will redirect automatically via redirectTo option
    } catch (error: any) {
      setError(error.message || 'An error occurred during Google sign in');
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  return (
    <div className="bg-background text-foreground">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg shadow-lg max-w-md">
          {error}
        </div>
      )}
      <SignUpPage
        title={<span className="font-light text-foreground tracking-tighter">Create an account</span>}
        description="Start building your visual knowledge system with AI-powered workflows"
        heroImageSrc="/images/medium_example.png"
        testimonials={sampleTestimonials}
        onSignUp={handleSignUp}
        onGoogleSignIn={handleGoogleSignIn}
        onSignIn={handleSignIn}
      />
    </div>
  );
}

