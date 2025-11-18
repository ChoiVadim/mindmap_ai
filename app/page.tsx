'use client';

import { ReactFlowProvider } from '@xyflow/react';
import Canvas from '@/components/Canvas';
import LandingPage from '@/components/LandingPage';
import { useAuth } from '@/components/auth/AuthProvider';
import { Component as LumaSpin } from '@/components/ui/luma-spin';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <LumaSpin />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <ReactFlowProvider>
      <main className="w-full h-screen">
        <Canvas />
      </main>
    </ReactFlowProvider>
  );
}
