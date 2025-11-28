"use client";

import { Bot, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentFamily } from "@/store/slices/family.slice";
import {
  fetchFamilySettings,
  selectFamilySettings,
  selectSettingsError,
  selectSettingsLoading,
} from "@/store/slices/settings.slice";
import { AISettingsTab } from "./ai-settings-tab";
import { FeaturesTab } from "./features-tab";

interface SettingsViewProps {
  dict: {
    pages: {
      settings: {
        title: string;
        description: string;
        tabs: {
          features: string;
          aiSettings: string;
        };
        featuresTab: {
          title: string;
          description: string;
          features: Record<string, { label: string; description: string }>;
          about: {
            title: string;
            description1: string;
            description2: string;
          };
        };
        aiSettingsTab: {
          title: string;
          description: string;
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
          about: {
            title: string;
            description: string;
            providers: {
              openai: string;
              azure: string;
              local: string;
              other: string;
            };
            securityNote: string;
          };
        };
        toast: {
          featureEnabled: string;
          featureDisabled: string;
          featureEnabledDescription: string;
          featureDisabledDescription: string;
          aiSettingsSaved: string;
          aiSettingsSavedDescription: string;
          settingsUpdateError: string;
          settingsUpdateErrorDescription: string;
          validationError: string;
          allFieldsRequired: string;
          invalidUrl: string;
          invalidUrlDescription: string;
          providerRequired: string;
        };
        errors: {
          unauthorized: string;
          loadFailed: string;
        };
      };
    };
  };
}

export function SettingsView({ dict }: SettingsViewProps) {
  const dispatch = useAppDispatch();
  const currentFamily = useAppSelector(selectCurrentFamily);
  const settings = useAppSelector(
    selectFamilySettings(currentFamily?.familyId),
  );
  const isLoading = useAppSelector(selectSettingsLoading);
  const error = useAppSelector(selectSettingsError);

  useEffect(() => {
    if (currentFamily?.familyId) {
      dispatch(fetchFamilySettings(currentFamily.familyId));
    }
  }, [dispatch, currentFamily?.familyId]);

  if (isLoading && !settings) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-destructive">
          {dict.pages.settings.errors.loadFailed}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="hidden lg:flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{dict.pages.settings.title}</h1>
          <p className="text-muted-foreground">
            {dict.pages.settings.description}
          </p>
        </div>
      </div>

      <Tabs defaultValue="features" className="w-full">
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="features" data-testid="features-tab">
              {dict.pages.settings.tabs.features}
            </TabsTrigger>
            <TabsTrigger value="ai-settings" data-testid="ai-settings-tab">
              {dict.pages.settings.tabs.aiSettings}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{dict.pages.settings.featuresTab.title}</CardTitle>
                  <CardDescription>
                    {dict.pages.settings.featuresTab.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FeaturesTab
                dict={dict.pages.settings}
                settings={settings}
                familyId={currentFamily?.familyId}
              />
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>
                {dict.pages.settings.featuresTab.about.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{dict.pages.settings.featuresTab.about.description1}</p>
              <p>{dict.pages.settings.featuresTab.about.description2}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-settings" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>
                    {dict.pages.settings.aiSettingsTab.title}
                  </CardTitle>
                  <CardDescription>
                    {dict.pages.settings.aiSettingsTab.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AISettingsTab
                dict={dict.pages.settings}
                settings={settings}
                familyId={currentFamily?.familyId}
              />
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>
                {dict.pages.settings.aiSettingsTab.about.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{dict.pages.settings.aiSettingsTab.about.description}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  {dict.pages.settings.aiSettingsTab.about.providers.openai}
                </li>
                <li>
                  {dict.pages.settings.aiSettingsTab.about.providers.azure}
                </li>
                <li>
                  {dict.pages.settings.aiSettingsTab.about.providers.local}
                </li>
                <li>
                  {dict.pages.settings.aiSettingsTab.about.providers.other}
                </li>
              </ul>
              <p className="pt-2">
                {dict.pages.settings.aiSettingsTab.about.securityNote}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
