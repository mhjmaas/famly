import {
  BookOpen,
  Camera,
  CheckSquare,
  Coins,
  Database,
  Eye,
  Home,
  Key,
  Lock,
  MapPin,
  MessageSquare,
  Server,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
  Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
};

export const features: Feature[] = [
  {
    icon: BookOpen,
    title: 'Personal Diary',
    description: 'Capture your thoughts and memories in a private, secure space.',
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
  },
  {
    icon: MessageSquare,
    title: 'Family Messaging',
    description: 'Stay connected with secure, private messaging for your family.',
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
  },
  {
    icon: MapPin,
    title: 'Location Sharing',
    description: 'Know where your loved ones are with optional real-time location sharing.',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  {
    icon: CheckSquare,
    title: 'Tasks & Chores',
    description: 'Organize household responsibilities and track completion.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Camera,
    title: 'Shared Memories',
    description: 'Create a family timeline of photos, videos, and special moments.',
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
  },
  {
    icon: ShoppingCart,
    title: 'Shopping Lists',
    description: 'Collaborative shopping lists that sync across all family members.',
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
  },
  {
    icon: UtensilsCrossed,
    title: 'Recipe Management',
    description: 'Store and share your favorite family recipes in one place.',
    color: 'text-chart-5',
    bgColor: 'bg-chart-5/10',
  },
  {
    icon: Coins,
    title: 'Allowance & Rewards',
    description: 'Manage allowances and reward systems for completed tasks.',
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
  },
  {
    icon: Sparkles,
    title: 'AI Integration',
    description: 'Optional AI features to help with meal planning, scheduling, and more.',
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
  },
  {
    icon: Home,
    title: 'Smart Home Integration',
    description: 'Connect with Home Assistant and other home management platforms.',
    color: 'text-chart-1',
    bgColor: 'bg-chart-1/10',
  },
];

export const selfHostedFeatures = [
  'Complete data ownership',
  'Host on your own hardware',
  'One-command Docker setup',
  'Unlimited family members',
  'All features included',
  'Free forever',
  'Community support',
  'Regular updates',
];

export const cloudFeatures = [
  'Managed hosting',
  'Automatic backups',
  'Zero maintenance',
  '99.9% uptime SLA',
  'All features included',
  'Priority support',
  'Early access to new features',
  'Cancel anytime',
];

export type PrivacyFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const privacyFeatures: PrivacyFeature[] = [
  {
    icon: Shield,
    title: 'Your Data, Your Control',
    description:
      'We never sell, share, or use your data for advertising. Your family information belongs to you alone.',
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'All sensitive data is encrypted both in transit and at rest, ensuring maximum security.',
  },
  {
    icon: Server,
    title: 'Self-Hosting Freedom',
    description:
      'Host Famly on your own infrastructure with our easy Docker setup. Complete control, zero compromises.',
  },
  {
    icon: Eye,
    title: 'Zero Tracking',
    description: 'No analytics, no tracking pixels, no third-party scripts. We respect your privacy completely.',
  },
  {
    icon: Database,
    title: 'Data Portability',
    description: 'Export your data anytime in standard formats. No lock-in, no barriers to leaving.',
  },
  {
    icon: Key,
    title: 'Open Source',
    description: 'Our code is open for inspection. Verify our security claims and contribute to the project.',
  },
];
