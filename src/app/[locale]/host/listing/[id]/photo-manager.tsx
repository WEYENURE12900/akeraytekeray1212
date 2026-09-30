"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  addListingPhotoAction,
  removeListingPhotoAction,
  setCoverPhotoAction,
} from "@/actions/listings";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { photoUrl } from "@/lib/photos";
import type { Locale } from "@/lib/types";

interface Photo {
  id: string;
  key: string;
  alt: string | null;
}

/**
 * Gallery editor: upload, remove, promote to cover. The first photo is the
 * cover — that is how the DB treats sort_order, so the UI just mirrors it.
 */
export function PhotoManager({
  listingId,
  locale,
  photos,
}: {
  listingId: string;
  locale: Locale;
  photos: Photo[];
}) {
  const { t } = useI18n();
  const fileInput = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const onFile = (file: File | null) => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.set("locale", locale);
    form.set("listingId", listingId);
    form.set("photo", file);
    startTransition(async () => {
      try {
        const res = await addListingPhotoAction(form);
        if (!res.ok) {
          toast.error(t(res.error ?? "error.uploadFailed"));
        } else {
          toast.success(t("common.save"));
        }
      } catch {
        toast.error(t("error.uploadFailed"));
      } finally {
        setUploading(false);
        if (fileInput.current) fileInput.current.value = "";
      }
    });
  };

  const remove = (photo: Photo) => {
    const form = new FormData();
    form.set("locale", locale);
    form.set("listingId", listingId);
    form.set("photoId", photo.id);
    form.set("key", photo.key);
    startTransition(() => removeListingPhotoAction(form));
  };

  const makeCover = (photo: Photo) => {
    const form = new FormData();
    form.set("locale", locale);
    form.set("listingId", listingId);
    form.set("photoId", photo.id);
    form.set("key", photo.key);
    startTransition(() => setCoverPhotoAction(form));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <figure
            key={photo.id}
            className="group relative overflow-hidden rounded-xl border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl(photo.key)}
              alt={photo.alt ?? ""}
              className="aspect-[4/3] w-full object-cover"
            />
            {index === 0 ? (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                <Star className="size-3 fill-white" aria-hidden />
                {t("wizard.coverPhoto")}
              </span>
            ) : null}
            <figcaption className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              {index !== 0 ? (
                <button
                  type="button"
                  onClick={() => makeCover(photo)}
                  disabled={isPending}
                  title={t("wizard.makeCover")}
                  className="grid size-7 place-items-center rounded-full bg-white/90 text-ink-700 hover:bg-white"
                >
                  <Star className="size-3.5" aria-hidden />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => remove(photo)}
                disabled={isPending}
                title={t("common.delete")}
                className="grid size-7 place-items-center rounded-full bg-white/90 text-destructive hover:bg-white"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </figcaption>
          </figure>
        ))}

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading || isPending}
          className="grid aspect-[4/3] place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <span className="flex flex-col items-center gap-1.5 text-xs">
            <ImagePlus className="size-6" aria-hidden />
            {uploading ? t("wizard.uploading") : t("wizard.addPhotos")}
          </span>
        </button>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />

      <p className="text-xs text-muted-foreground">
        {t("wizard.photoCount", { count: photos.length, max: 20 })}
      </p>
    </div>
  );
}
