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

export type FeatureCardKey =
  | 'personalDiary'
  | 'familyMessaging'
  | 'locationSharing'
  | 'tasksAndChores'
  | 'sharedMemories'
  | 'shoppingLists'
  | 'recipeManagement'
  | 'allowanceRewards'
  | 'aiIntegration'
  | 'smartHomeIntegration';

export type FeatureCard = {
  key: FeatureCardKey;
  icon: LucideIcon;
  color: string;
  bgColor: string;
};

export const featureCards: FeatureCard[] = [
  {
    key: 'personalDiary',
    icon: BookOpen,
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
  },
  {
    key: 'familyMessaging',
    icon: MessageSquare,
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
  },
  {
    key: 'locationSharing',
    icon: MapPin,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  {
    key: 'tasksAndChores',
    icon: CheckSquare,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    key: 'sharedMemories',
    icon: Camera,
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
  },
  {
    key: 'shoppingLists',
    icon: ShoppingCart,
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
  },
  {
    key: 'recipeManagement',
    icon: UtensilsCrossed,
    color: 'text-chart-5',
    bgColor: 'bg-chart-5/10',
  },
  {
    key: 'allowanceRewards',
    icon: Coins,
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
  },
  {
    key: 'aiIntegration',
    icon: Sparkles,
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
  },
  {
    key: 'smartHomeIntegration',
    icon: Home,
    color: 'text-chart-1',
    bgColor: 'bg-chart-1/10',
  },
];

export const featureHighlightBulletKeys = [
  'intuitiveInterface',
  'worksOnAllDevices',
  'offlineFirstDesign',
  'customizable',
] as const;

export type FeatureHighlightBulletKey = (typeof featureHighlightBulletKeys)[number];

export const selfHostedFeatureKeys = [
  'completeDataOwnership',
  'hostOnYourHardware',
  'oneCommandDockerSetup',
  'unlimitedFamilyMembers',
  'allFeaturesIncluded',
  'freeForever',
  'communitySupport',
  'regularUpdates',
] as const;

export type SelfHostedFeatureKey = (typeof selfHostedFeatureKeys)[number];

export const cloudFeatureKeys = [
  'managedHosting',
  'automaticBackups',
  'zeroMaintenance',
  'uptimeSla',
  'allFeaturesIncluded',
  'prioritySupport',
  'earlyAccess',
  'cancelAnytime',
] as const;

export type CloudFeatureKey = (typeof cloudFeatureKeys)[number];

export type PrivacyFeatureKey =
  | 'yourDataYourControl'
  | 'endToEndEncryption'
  | 'selfHostingFreedom'
  | 'zeroTracking'
  | 'dataPortability'
  | 'openSource';

export type PrivacyFeatureCard = {
  key: PrivacyFeatureKey;
  icon: LucideIcon;
};

export const privacyFeatureCards: PrivacyFeatureCard[] = [
  {
    key: 'yourDataYourControl',
    icon: Shield,
  },
  {
    key: 'endToEndEncryption',
    icon: Lock,
  },
  {
    key: 'selfHostingFreedom',
    icon: Server,
  },
  {
    key: 'zeroTracking',
    icon: Eye,
  },
  {
    key: 'dataPortability',
    icon: Database,
  },
  {
    key: 'openSource',
    icon: Key,
  },
];
