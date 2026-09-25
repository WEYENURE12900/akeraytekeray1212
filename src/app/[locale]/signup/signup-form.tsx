"use client";

import { useActionState } from "react";

import { signUpAction, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/client";
import type { Locale } from "@/lib/types";

export function SignUpForm({ locale, next }: { locale: Locale; next: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUpAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next} />

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{t(state.error)}</AlertDescription>
        </Alert>
      ) : null}

      <Field label={t("auth.fullName")} htmlFor="fullName" required>
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </Field>

      <Field
        label={t("auth.identifier")}
        htmlFor="identifier"
        required
        hint={t("auth.identifierHint")}
      >
        <Input id="identifier" name="identifier" type="text" autoComplete="username" required />
      </Field>

      <Field label={t("auth.emailOptional")} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" />
      </Field>

      <Field label={t("auth.password")} htmlFor="password" required hint={t("auth.passwordHint")}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <Field label={t("auth.confirmPassword")} htmlFor="confirmPassword" required>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <label className="flex items-start gap-2.5 text-sm text-ink-700 cursor-pointer pt-1">
        <Checkbox name="isHost" value="1" className="mt-0.5" />
        <span>
          <span className="block font-medium">{t("auth.wantToHost")}</span>
          <span className="block text-xs text-muted-foreground">{t("auth.wantToHostHint")}</span>
        </span>
      </label>

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {t("auth.submitSignUp")}
      </Button>
    </form>
  );
}
