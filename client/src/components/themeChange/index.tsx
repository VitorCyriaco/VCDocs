'use client';
import { useEffect, useState } from 'react';

export default function ThemeChage() {
  const [theme, setTheme] = useState<string | 'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored ? stored : prefersDark ? 'dark' : 'light';

    setTheme(initial);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initial);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(nextTheme);
  };

  return (
    <>
      <div className='flex items-center justify-center h-10 w-5 bg-black/10 rounded-xl check relative'>
        <input className='opacity-0 h-10 w-5 z-50' type="checkbox" onClick={toggleTheme} />
        <span className='flex items-center justify-center w-5 h-5 bg-black/10 rounded-full absolute top-0 toggle'>{theme === 'dark' ? '🌙' : '☀️'}</span>
      </div>
    </>
  );
}
