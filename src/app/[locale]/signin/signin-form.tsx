"use client";

import { useActionState } from "react";

import { signInAction, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/types";

export function SignInForm({ locale, next }: { locale: Locale; next: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signInAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next} />

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{t(state.error)}</AlertDescription>
        </Alert>
      ) : null}

      <Field label={t("auth.identifier")} htmlFor="identifier" required hint={t("auth.identifierHint")}>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          placeholder="0911234567"
        />
      </Field>

      <Field label={t("auth.password")} htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {t("auth.submitSignIn")}
      </Button>
    </form>
  );
}
