'use client';

import { ReactFlowProvider } from '@xyflow/react';
import Canvas from '@/components/Canvas';

export default function Home() {
  return (
    <ReactFlowProvider>
      <main className="w-full h-screen">
        <Canvas />
      </main>
    </ReactFlowProvider>
  );
}
