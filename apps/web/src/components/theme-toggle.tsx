'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './theme-provider';
import { Button } from '@/components/ui/button';

/**
 * Theme toggle component with three modes: Light, Dark, and Auto (system)
 * Displays as a segmented control with active state highlighting
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'Auto' },
  ];

  return (
    <div data-testid="theme-toggle" className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {themes.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          data-testid={`theme-${value}`}
          variant="ghost"
          size="sm"
          onClick={() => setTheme(value)}
          className={`gap-2 ${theme === value ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon className="h-4 w-4" />
          <span className="text-xs">{label}</span>
        </Button>
      ))}
    </div>
  );
}
