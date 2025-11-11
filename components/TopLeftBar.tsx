'use client';

import { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { Dock } from '@/components/ui/dock-two';
import { motion } from 'framer-motion';

interface Board {
  id: string;
  name: string;
}

export default function TopLeftBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentBoard, setCurrentBoard] = useState<Board>({
    id: '1',
    name: 'Main Board',
  });

  // Пример доступных бордов - в будущем это можно загружать из API
  const boards: Board[] = [
    { id: '1', name: 'Main Board' },
    { id: '2', name: 'AI Research' },
    { id: '3', name: 'Project Ideas' },
  ];

  const handleBoardChange = (board: Board) => {
    setCurrentBoard(board);
    setIsDropdownOpen(false);
    // Здесь можно добавить логику переключения борда
  };

  const dockItems = [
    {
      icon: LayoutDashboard,
      label: currentBoard.name,
      onClick: () => setIsDropdownOpen(!isDropdownOpen),
    },
  ];

  return (
    <div className="fixed top-6 left-6 z-10">
      <div className="relative">
        <Dock 
          items={dockItems}
          variant="compact"
          tooltipPosition="right"
          prefix={
            <>
              <Image
                src="/icon.png"
                alt="MindCanvas Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="font-bold text-lg text-foreground">
                MindCanvas
              </span>
            </>
          }
        />

        {/* Dropdown */}
        {isDropdownOpen && (
          <>
            {/* Overlay to close dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 mt-2 w-48 rounded-lg shadow-xl py-1 z-20 bg-popover border border-border"
            >
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => handleBoardChange(board)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    board.id === currentBoard.id
                      ? 'bg-secondary font-medium text-foreground'
                      : 'text-foreground/70 hover:bg-secondary/50'
                  }`}
                >
                  {board.name}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

