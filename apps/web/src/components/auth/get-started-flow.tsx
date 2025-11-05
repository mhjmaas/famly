"use client";

import { AlertCircle, Check, Cloud, Server } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { Locale } from "@/i18n/config";
import type { DictionarySection } from "@/i18n/types";
import { ApiError, createFamily, getMe, getKarmaBalance } from "@/lib/api-client";
import { RegistrationForm } from "./registration-form";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/user.slice";
import { setKarma } from "@/store/slices/karma.slice";

type DeploymentOption = "self-hosted" | "cloud" | null;

interface GetStartedFlowProps {
  locale: Locale;
  dict: DictionarySection<"auth">["getStarted"];
  commonDict: DictionarySection<"auth">["common"];
  initialStep?: "choose" | "register" | "family";
}

export function GetStartedFlow({
  locale,
  dict,
  commonDict,
  initialStep = "choose",
}: GetStartedFlowProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<"choose" | "register" | "family">(
    initialStep,
  );
  const [_deploymentOption, setDeploymentOption] =
    useState<DeploymentOption>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Family form state
  const [familyName, setFamilyName] = useState("");

  const handleOptionSelect = (option: DeploymentOption) => {
    setDeploymentOption(option);
    if (option === "self-hosted") {
      // For self-hosted, show instructions or redirect to documentation
      window.open("https://github.com/famly/famly", "_blank");
    } else {
      // For cloud, proceed to registration
      setStep("register");
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Create family
      await createFamily({ name: familyName });

      // Fetch user data and populate Redux store
      const meResponse = await getMe();
      dispatch(setUser(meResponse.user));

      // Fetch karma balance if user has a family
      if (meResponse.user.families?.[0]) {
        const karmaData = await getKarmaBalance(
          meResponse.user.families[0].familyId,
          meResponse.user.id
        );
        dispatch(setKarma({ userId: meResponse.user.id, balance: karmaData.balance }));
      }

      // Redirect to app
      router.push(`/${locale}/app`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || commonDict.unexpectedError);
      } else {
        setError(commonDict.unexpectedError);
      }
      setIsLoading(false);
    }
  };

  const totalSteps = 2;
  const progressValue = step === "choose" ? 0 : step === "register" ? 50 : 100;
  const currentStepNumber = step === "register" ? 1 : 2;
  const progressLabel = dict.progress.step
    .replace("{current}", currentStepNumber.toString())
    .replace("{total}", totalSteps.toString());
  const progressCaption =
    step === "register"
      ? dict.progress.labels.register
      : dict.progress.labels.family;

  return (
    <div className="w-full max-w-2xl space-y-6" data-testid="get-started-flow">
      {step !== "choose" && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progressLabel}</span>
            <span>{progressCaption}</span>
          </div>
          <Progress
            value={progressValue}
            className="h-2"
            data-testid="get-started-progress"
          />
        </div>
      )}

      {step === "choose" && (
        <Card className="border-2" data-testid="deployment-choice-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {dict.deployment.title}
            </CardTitle>
            <CardDescription className="text-center">
              {dict.deployment.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleOptionSelect("self-hosted")}
              className="group relative overflow-hidden rounded-lg border-2 border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg"
              data-testid="deployment-self-hosted"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-chart-1/10 p-4">
                  <Server className="h-8 w-8 text-chart-1" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">
                    {dict.deployment.selfHosted.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {dict.deployment.selfHosted.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-chart-2">
                    <Check className="h-4 w-4" />
                    {dict.deployment.selfHosted.highlight}
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleOptionSelect("cloud")}
              className="group relative overflow-hidden rounded-lg border-2 border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg"
              data-testid="deployment-cloud"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <Cloud className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">
                    {dict.deployment.cloud.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {dict.deployment.cloud.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                    <span>{dict.deployment.cloud.highlight}</span>
                  </div>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      )}

      {step === "register" && (
        <RegistrationForm
          dict={dict}
          commonDict={commonDict}
          error={error}
          setError={setError}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onSuccess={() => setStep("family")}
        />
      )}

      {step === "family" && (
        <Card className="border-2" data-testid="family-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {dict.family.title}
            </CardTitle>
            <CardDescription>{dict.family.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateFamily} className="space-y-4">
              {error && (
                <Alert variant="destructive" data-testid="family-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="familyName">
                  {dict.family.fields.familyName.label}
                </Label>
                <Input
                  id="familyName"
                  type="text"
                  placeholder={dict.family.fields.familyName.placeholder}
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  disabled={isLoading}
                  required
                  data-testid="family-name"
                />
                <p className="text-sm text-muted-foreground">
                  {dict.family.fields.familyName.helper}
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="family-submit"
              >
                {isLoading
                  ? dict.family.button.loading
                  : dict.family.button.idle}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
