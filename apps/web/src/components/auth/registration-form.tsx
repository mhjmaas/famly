"use client";

import { AlertCircle, ArrowRight } from "lucide-react";
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
import type { DictionarySection } from "@/i18n/types";
import { ApiError, register } from "@/lib/api-client";

interface RegistrationFormProps {
  dict: DictionarySection<"auth">["getStarted"];
  commonDict: DictionarySection<"auth">["common"];
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess: () => void;
}

export function RegistrationForm({
  dict,
  commonDict,
  error,
  setError,
  isLoading,
  setIsLoading,
  onSuccess,
}: RegistrationFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(dict.errors.passwordMismatch);
      return;
    }

    if (!birthdate) {
      setError(dict.errors.birthdateRequired);
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name,
        email,
        password,
        birthdate,
      });

      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || commonDict.unexpectedError);
      } else {
        setError(commonDict.unexpectedError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2" data-testid="register-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {dict.register.title}
        </CardTitle>
        <CardDescription>{dict.register.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <Alert variant="destructive" data-testid="register-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{dict.register.fields.name.label}</Label>
            <Input
              id="name"
              type="text"
              placeholder={dict.register.fields.name.placeholder}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isLoading}
              required
              data-testid="register-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{dict.register.fields.email.label}</Label>
            <Input
              id="email"
              type="email"
              placeholder={dict.register.fields.email.placeholder}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
              required
              data-testid="register-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthdate">
              {dict.register.fields.birthdate.label}
            </Label>
            <Input
              id="birthdate"
              type="date"
              value={birthdate}
              onChange={(event) => setBirthdate(event.target.value)}
              disabled={isLoading}
              required
              data-testid="register-birthdate"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              {dict.register.fields.password.label}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={dict.register.fields.password.placeholder}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError("");
              }}
              disabled={isLoading}
              required
              minLength={8}
              data-testid="register-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {dict.register.fields.confirmPassword.label}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={dict.register.fields.confirmPassword.placeholder}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (error) setError("");
              }}
              disabled={isLoading}
              required
              data-testid="register-confirm-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            data-testid="register-submit"
          >
            {isLoading
              ? dict.register.button.loading
              : dict.register.button.idle}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
