import { SunIcon, MoonIcon } from '@heroicons/react/outline';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from './button';

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Button data-testid={'theme-btn'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </Button>
  );
};
