'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface Board {
  id: string;
  name: string;
}

export default function TopLeftBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [currentBoard, setCurrentBoard] = useState<Board>({
    id: '1',
    name: 'Main Board',
  });

  useEffect(() => {
    // Проверяем текущую тему
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };
    
    checkTheme();
    
    // Слушаем изменения темы
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

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

  const borderColor = isDark ? '#374151' : '#e5e7eb';

  return (
    <div className="fixed top-6 left-6 z-10">
      <div 
        className="rounded-lg shadow-lg px-4 py-3"
        style={{ 
          backgroundColor: isDark ? '#1f2937' : '#f9fafb',
          border: `1px solid ${borderColor}`
        }}
      >
        <div className="flex items-center gap-3">
          {/* Logo/Icon */}
          <div className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="MindCanvas Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span 
              className="font-bold text-lg dark:text-white"
              style={{ color: isDark ? '#ffffff' : '#111827' }}
            >
              MindCanvas
            </span>
          </div>

          {/* Divider */}
          <div 
            className="w-px h-6 dark:bg-gray-600"
            style={{ backgroundColor: isDark ? '#4b5563' : '#d1d5db' }}
          />

          {/* Board Selector */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
              style={{
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span 
                className="text-sm font-medium dark:text-gray-200"
                style={{ color: isDark ? '#e5e7eb' : '#374151' }}
              >
                {currentBoard.name}
              </span>
              <ChevronDown
                className={`w-4 h-4 dark:text-gray-400 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                style={{ color: isDark ? '#9ca3af' : '#6b7280' }}
              />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <>
                {/* Overlay to close dropdown */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />
                
                <div 
                  className="absolute top-full left-0 mt-2 w-48 rounded-lg shadow-xl py-1 z-20"
                  style={{ 
                    backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                    border: `1px solid ${borderColor}`
                  }}
                >
                  {boards.map((board) => (
                    <button
                      key={board.id}
                      onClick={() => handleBoardChange(board)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        board.id === currentBoard.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 font-medium'
                          : 'dark:text-gray-300'
                      }`}
                      onMouseEnter={(e) => {
                        if (board.id !== currentBoard.id) {
                          e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (board.id !== currentBoard.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                      style={{
                        color: board.id === currentBoard.id
                          ? (isDark ? '#60a5fa' : '#2563eb')
                          : (isDark ? '#d1d5db' : '#374151')
                      }}
                    >
                      {board.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

