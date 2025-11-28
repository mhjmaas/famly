"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FamilySettings } from "@/lib/api-client";
import { useAppDispatch } from "@/store/hooks";
import { updateFamilySettingsThunk } from "@/store/slices/settings.slice";

interface AISettingsTabProps {
  dict: {
    aiSettingsTab: {
      fields: {
        aiName: { label: string; placeholder: string; helper: string };
        apiEndpoint: { label: string; placeholder: string; helper: string };
        apiSecret: { label: string; placeholder: string; helper: string };
        modelName: { label: string; placeholder: string; helper: string };
        provider: { label: string; placeholder: string; helper: string };
      };
      buttons: {
        save: string;
        saving: string;
        reset: string;
      };
    };
    toast: {
      aiSettingsSaved: string;
      aiSettingsSavedDescription: string;
      settingsUpdateError: string;
      validationError: string;
      allFieldsRequired: string;
      invalidUrl: string;
      invalidUrlDescription: string;
      providerRequired: string;
    };
  };
  settings: FamilySettings | null;
  familyId: string | undefined;
}

const DEFAULT_AI_SETTINGS = {
  apiEndpoint: "",
  apiSecret: "",
  modelName: "",
  aiName: "",
  provider: "",
};

export function AISettingsTab({
  dict,
  settings,
  familyId,
}: AISettingsTabProps) {
  const dispatch = useAppDispatch();
  const [isSaving, setIsSaving] = useState(false);

  const [aiSettings, setAISettings] = useState({
    apiEndpoint: settings?.aiSettings?.apiEndpoint || "",
    apiSecret: "",
    modelName: settings?.aiSettings?.modelName || "",
    aiName: settings?.aiSettings?.aiName || "",
    provider: settings?.aiSettings?.provider || "",
  });

  const handleSave = async () => {
    if (!familyId) return;

    setIsSaving(true);

    // Validate required fields
    if (
      !aiSettings.apiEndpoint ||
      !aiSettings.apiSecret ||
      !aiSettings.modelName ||
      !aiSettings.aiName ||
      !aiSettings.provider
    ) {
      toast.error(dict.toast.validationError, {
        description: dict.toast.allFieldsRequired,
      });
      setIsSaving(false);
      return;
    }

    // Validate URL format
    try {
      new URL(aiSettings.apiEndpoint);
    } catch {
      toast.error(dict.toast.invalidUrl, {
        description: dict.toast.invalidUrlDescription,
      });
      setIsSaving(false);
      return;
    }

    try {
      await dispatch(
        updateFamilySettingsThunk({
          familyId,
          settings: {
            enabledFeatures: settings?.enabledFeatures || [],
            aiSettings: {
              apiEndpoint: aiSettings.apiEndpoint,
              apiSecret: aiSettings.apiSecret,
              modelName: aiSettings.modelName,
              aiName: aiSettings.aiName,
              provider: aiSettings.provider as
                | "LM Studio"
                | "Ollama"
                | "OpenAI",
            },
          },
        }),
      ).unwrap();

      // Update localStorage
      if (typeof window !== "undefined") {
        const currentSettings = settings?.enabledFeatures || [];
        localStorage.setItem(
          `famly-enabled-features-${familyId}`,
          JSON.stringify(currentSettings),
        );
      }

      toast.success(dict.toast.aiSettingsSaved, {
        description: dict.toast.aiSettingsSavedDescription.replace(
          "{aiName}",
          aiSettings.aiName,
        ),
      });
    } catch (error) {
      toast.error(dict.toast.settingsUpdateError, {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setAISettings(DEFAULT_AI_SETTINGS);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="ai-name">
          {dict.aiSettingsTab.fields.aiName.label}
        </Label>
        <Input
          id="ai-name"
          placeholder={dict.aiSettingsTab.fields.aiName.placeholder}
          value={aiSettings.aiName}
          onChange={(e) =>
            setAISettings({ ...aiSettings, aiName: e.target.value })
          }
          data-testid="ai-name-input"
        />
        <p className="text-xs text-muted-foreground">
          {dict.aiSettingsTab.fields.aiName.helper}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-endpoint">
          {dict.aiSettingsTab.fields.apiEndpoint.label}
        </Label>
        <Input
          id="api-endpoint"
          type="url"
          placeholder={dict.aiSettingsTab.fields.apiEndpoint.placeholder}
          value={aiSettings.apiEndpoint}
          onChange={(e) =>
            setAISettings({ ...aiSettings, apiEndpoint: e.target.value })
          }
          data-testid="api-endpoint-input"
        />
        <p className="text-xs text-muted-foreground">
          {dict.aiSettingsTab.fields.apiEndpoint.helper}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-secret">
          {dict.aiSettingsTab.fields.apiSecret.label}
        </Label>
        <Input
          id="api-secret"
          type="password"
          placeholder={dict.aiSettingsTab.fields.apiSecret.placeholder}
          value={aiSettings.apiSecret}
          onChange={(e) =>
            setAISettings({ ...aiSettings, apiSecret: e.target.value })
          }
          data-testid="api-secret-input"
        />
        <p className="text-xs text-muted-foreground">
          {dict.aiSettingsTab.fields.apiSecret.helper}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="model-name">
          {dict.aiSettingsTab.fields.modelName.label}
        </Label>
        <Input
          id="model-name"
          placeholder={dict.aiSettingsTab.fields.modelName.placeholder}
          value={aiSettings.modelName}
          onChange={(e) =>
            setAISettings({ ...aiSettings, modelName: e.target.value })
          }
          data-testid="model-name-input"
        />
        <p className="text-xs text-muted-foreground">
          {dict.aiSettingsTab.fields.modelName.helper}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="provider">
          {dict.aiSettingsTab.fields.provider.label}
        </Label>
        <Select
          value={aiSettings.provider}
          onValueChange={(value) =>
            setAISettings({ ...aiSettings, provider: value })
          }
        >
          <SelectTrigger id="provider" data-testid="provider-select">
            <SelectValue
              placeholder={dict.aiSettingsTab.fields.provider.placeholder}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LM Studio">LM Studio</SelectItem>
            <SelectItem value="Ollama">Ollama</SelectItem>
            <SelectItem value="OpenAI">OpenAI</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {dict.aiSettingsTab.fields.provider.helper}
        </p>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2"
          data-testid="save-ai-settings-button"
        >
          <Save className="h-4 w-4" />
          {isSaving
            ? dict.aiSettingsTab.buttons.saving
            : dict.aiSettingsTab.buttons.save}
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isSaving}
          data-testid="reset-ai-settings-button"
        >
          {dict.aiSettingsTab.buttons.reset}
        </Button>
      </div>
    </div>
  );
}
