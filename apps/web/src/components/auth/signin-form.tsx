"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/config";
import type { DictionarySection } from "@/i18n/types";
import { ApiError, getKarmaBalance, getMe, login } from "@/lib/api-client";
import { useAppDispatch } from "@/store/hooks";
import { setKarma } from "@/store/slices/karma.slice";
import { setUser } from "@/store/slices/user.slice";

interface SignInFormProps {
  locale: Locale;
  dict: DictionarySection<"auth">["signIn"];
  commonDict: DictionarySection<"auth">["common"];
}

export function SignInForm({ locale, dict, commonDict }: SignInFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Login
      await login({ email, password });

      // Fetch user data and populate Redux store
      const meResponse = await getMe();
      dispatch(setUser(meResponse.user));

      // Fetch karma balance if user has a family
      if (meResponse.user.families?.[0]) {
        const karmaData = await getKarmaBalance(
          meResponse.user.families[0].familyId,
          meResponse.user.id,
        );
        dispatch(
          setKarma({
            userId: meResponse.user.id,
            balance: karmaData.totalKarma,
          }),
        );
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

  return (
    <Card className="w-full max-w-md border-2" data-testid="signin-form">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {dict.title}
        </CardTitle>
        <CardDescription className="text-center">
          {dict.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" data-testid="signin-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{dict.fields.email.label}</Label>
            <Input
              id="email"
              type="email"
              placeholder={dict.fields.email.placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              data-testid="signin-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{dict.fields.password.label}</Label>
            <Input
              id="password"
              type="password"
              placeholder={dict.fields.password.placeholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              data-testid="signin-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            data-testid="signin-submit"
          >
            {isLoading ? dict.submit.loading : dict.submit.idle}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-muted-foreground">
          {dict.cta.prompt}{" "}
          <Link
            href={`/${locale}/get-started?step=register`}
            className="text-primary hover:underline font-medium"
            data-testid="signin-get-started-link"
          >
            {dict.cta.link}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
