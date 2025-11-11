'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Dock } from '@/components/ui/dock-two';

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

  const dockItems = [
    {
      icon: isDark ? Sun : Moon,
      label: isDark ? 'Switch to light mode' : 'Switch to dark mode',
      onClick: toggleTheme,
    },
  ];

  return (
    <div className="fixed top-6 right-6 z-10">
      <Dock 
        items={dockItems}
        variant="compact"
        tooltipPosition="left"
      />
    </div>
  );
}

