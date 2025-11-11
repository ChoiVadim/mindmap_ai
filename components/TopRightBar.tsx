'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function TopRightBar() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Проверяем только сохраненную тему (светлая по умолчанию)
    const savedTheme = localStorage.getItem('theme');
    
    const shouldBeDark = savedTheme === 'dark';
    setIsDark(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const borderColor = isDark ? '#374151' : '#e5e7eb';

  return (
    <div className="fixed top-6 right-6 z-10">
      <div 
        className="rounded-lg shadow-lg p-2"
        style={{ 
          backgroundColor: isDark ? '#1f2937' : '#f9fafb',
          border: `1px solid ${borderColor}`
        }}
      >
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-all duration-200 group"
          style={{
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-yellow-500 group-hover:rotate-12 transition-transform" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 group-hover:-rotate-12 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
}

