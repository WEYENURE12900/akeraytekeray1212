"use client";

import { useRef, useState } from "react";
import { Pencil, Upload } from "lucide-react";

import { updateUserProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Checkbox } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/overlay";
import { useI18n } from "@/lib/i18n/client";

interface ProfileData {
  fullName: string;
  bio: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  isHost: boolean;
}

export function ProfileEditor({ profile }: { profile: ProfileData }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="size-3.5" aria-hidden />
          {t("profile.edit")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("profile.edit")}</DialogTitle>
          <DialogDescription>{t("profile.editBody")}</DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={updateUserProfileAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />

          <Field label={t("auth.fullName")} required>
            <Input
              name="fullName"
              required
              minLength={2}
              defaultValue={profile.fullName}
            />
          </Field>

          <Field label={t("profile.about")}>
            <Textarea
              name="bio"
              rows={3}
              defaultValue={profile.bio ?? ""}
              placeholder={t("profile.bioPlaceholder")}
            />
          </Field>

          <Field label={t("auth.city")}>
            <Input
              name="city"
              defaultValue={profile.city ?? ""}
              placeholder="Addis Ababa"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("auth.phone")}>
              <Input
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ""}
                placeholder="+251 911 123 456"
              />
            </Field>
            <Field label={t("auth.email")}>
              <Input
                name="email"
                type="email"
                defaultValue={profile.email ?? ""}
                placeholder="you@example.com"
              />
            </Field>
          </div>

          <Field label={t("profile.avatar")}>
            <Input name="avatar" type="file" accept="image/*" />
          </Field>

          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <Checkbox name="isHost" value="1" defaultChecked={profile.isHost} />
            {t("profile.wantToHost")}
          </label>

          <Button type="submit" className="w-full">
            {t("profile.save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
