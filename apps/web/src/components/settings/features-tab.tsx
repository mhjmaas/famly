"use client";

import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { FamilySettings } from "@/lib/api-client";
import { useAppDispatch } from "@/store/hooks";
import {
  ALL_FEATURES,
  type FeatureKey,
  updateFamilySettingsThunk,
} from "@/store/slices/settings.slice";

interface FeaturesTabProps {
  dict: {
    featuresTab: {
      features: Record<string, { label: string; description: string }>;
    };
    toast: {
      featureEnabled: string;
      featureDisabled: string;
      featureEnabledDescription: string;
      featureDisabledDescription: string;
      settingsUpdateError: string;
    };
  };
  settings: FamilySettings | null;
  familyId: string | undefined;
}

export function FeaturesTab({ dict, settings, familyId }: FeaturesTabProps) {
  const dispatch = useAppDispatch();

  const enabledFeatures = settings?.enabledFeatures ?? ALL_FEATURES;

  const toggleFeature = async (feature: FeatureKey) => {
    if (!familyId) return;

    const isCurrentlyEnabled = enabledFeatures.includes(feature);
    const newFeatures = isCurrentlyEnabled
      ? enabledFeatures.filter((f) => f !== feature)
      : [...enabledFeatures, feature];

    try {
      await dispatch(
        updateFamilySettingsThunk({
          familyId,
          settings: { enabledFeatures: newFeatures },
        }),
      ).unwrap();

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `famly-enabled-features-${familyId}`,
          JSON.stringify(newFeatures),
        );
      }

      const featureName = dict.featuresTab.features[feature]?.label || feature;
      toast.success(
        isCurrentlyEnabled
          ? dict.toast.featureDisabled
          : dict.toast.featureEnabled,
        {
          description: isCurrentlyEnabled
            ? dict.toast.featureDisabledDescription.replace(
                "{feature}",
                featureName,
              )
            : dict.toast.featureEnabledDescription.replace(
                "{feature}",
                featureName,
              ),
        },
      );
    } catch (error) {
      toast.error(dict.toast.settingsUpdateError, {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Use ALL_FEATURES from shared config - single source of truth
  const features: FeatureKey[] = [...ALL_FEATURES];

  return (
    <div className="space-y-4">
      {features.map((feature) => {
        const featureInfo = dict.featuresTab.features[feature];
        if (!featureInfo) return null;

        const isEnabled = enabledFeatures.includes(feature);

        return (
          <div
            key={feature}
            className="flex items-center justify-between"
            data-testid={`feature-toggle-${feature}`}
          >
            <div className="space-y-0.5">
              <Label
                htmlFor={feature}
                className="text-base font-medium cursor-pointer"
              >
                {featureInfo.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {featureInfo.description}
              </p>
            </div>
            <Switch
              id={feature}
              checked={isEnabled}
              onCheckedChange={() => toggleFeature(feature)}
              data-testid={`feature-switch-${feature}`}
            />
          </div>
        );
      })}
    </div>
  );
}
