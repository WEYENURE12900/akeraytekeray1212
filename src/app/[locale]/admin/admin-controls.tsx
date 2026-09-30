"use client";

import { useTransition } from "react";
import { Check, ShieldCheck, ShieldAlert, X, Eye, EyeOff, Trash2, UserCheck, Shield } from "lucide-react";
import { toast } from "sonner";

import {
  adminSetListingStatusAction,
  adminSetListingVerifiedAction,
  adminSetProviderStatusAction,
  adminSetProviderVerifiedAction,
  adminToggleUserRoleAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import type { ListingStatus, Locale } from "@/lib/types";

export function ListingVerifyButton({
  listingId,
  verified,
  locale,
}: {
  listingId: string;
  verified: boolean;
  locale: Locale;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await adminSetListingVerifiedAction(listingId, !verified, locale);
      toast.success(verified ? "Listing unverified" : "Listing marked as verified");
    });
  };

  return (
    <Button
      variant={verified ? "secondary" : "outline"}
      size="sm"
      className="h-8 rounded-full text-xs"
      onClick={handleToggle}
      loading={isPending}
    >
      <ShieldCheck className="size-3.5 mr-1" />
      {verified ? "Verified" : "Verify"}
    </Button>
  );
}

export function ListingStatusSelect({
  listingId,
  currentStatus,
  locale,
}: {
  listingId: string;
  currentStatus: ListingStatus;
  locale: Locale;
}) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (newStatus: ListingStatus) => {
    startTransition(async () => {
      await adminSetListingStatusAction(listingId, newStatus, locale);
      toast.success(`Status updated to ${newStatus}`);
    });
  };

  return (
    <div className="flex items-center gap-1">
      {currentStatus !== "published" && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full text-xs text-primary"
          onClick={() => handleChange("published")}
          loading={isPending}
        >
          <Eye className="size-3 mr-1" /> Publish
        </Button>
      )}
      {currentStatus === "published" && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full text-xs text-amber-600"
          onClick={() => handleChange("paused")}
          loading={isPending}
        >
          <EyeOff className="size-3 mr-1" /> Pause
        </Button>
      )}
      {currentStatus !== "removed" && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full text-xs text-destructive hover:bg-destructive/10"
          onClick={() => handleChange("removed")}
          loading={isPending}
        >
          <Trash2 className="size-3" />
        </Button>
      )}
    </div>
  );
}

export function ProviderVerifyButton({
  providerId,
  verified,
  locale,
}: {
  providerId: string;
  verified: boolean;
  locale: Locale;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await adminSetProviderVerifiedAction(providerId, !verified, locale);
      toast.success(verified ? "Provider unverified" : "Provider marked as verified");
    });
  };

  return (
    <Button
      variant={verified ? "secondary" : "outline"}
      size="sm"
      className="h-8 rounded-full text-xs"
      onClick={handleToggle}
      loading={isPending}
    >
      <ShieldCheck className="size-3.5 mr-1" />
      {verified ? "Verified" : "Verify"}
    </Button>
  );
}

export function ProviderStatusButtons({
  providerId,
  currentStatus,
  locale,
}: {
  providerId: string;
  currentStatus: string;
  locale: Locale;
}) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (newStatus: string) => {
    startTransition(async () => {
      await adminSetProviderStatusAction(providerId, newStatus, locale);
      toast.success(`Service status updated to ${newStatus}`);
    });
  };

  return (
    <div className="flex items-center gap-1">
      {currentStatus !== "published" && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full text-xs text-primary"
          onClick={() => handleChange("published")}
          loading={isPending}
        >
          <Check className="size-3 mr-1" /> Approve
        </Button>
      )}
      {currentStatus === "published" && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full text-xs text-amber-600"
          onClick={() => handleChange("paused")}
          loading={isPending}
        >
          <EyeOff className="size-3 mr-1" /> Pause
        </Button>
      )}
      {currentStatus !== "removed" && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full text-xs text-destructive hover:bg-destructive/10"
          onClick={() => handleChange("removed")}
          loading={isPending}
        >
          <Trash2 className="size-3" />
        </Button>
      )}
    </div>
  );
}

export function UserRoleButtons({
  userId,
  isHost,
  isAdmin,
  locale,
}: {
  userId: string;
  isHost: boolean;
  isAdmin: boolean;
  locale: Locale;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggleHost = () => {
    startTransition(async () => {
      await adminToggleUserRoleAction(userId, "is_host", !isHost, locale);
      toast.success(isHost ? "Host mode disabled" : "Host mode enabled");
    });
  };

  const handleToggleAdmin = () => {
    startTransition(async () => {
      await adminToggleUserRoleAction(userId, "is_admin", !isAdmin, locale);
      toast.success(isAdmin ? "Admin privileges revoked" : "Admin privileges granted");
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant={isHost ? "secondary" : "outline"}
        size="sm"
        className="h-8 rounded-full text-xs"
        onClick={handleToggleHost}
        loading={isPending}
      >
        <UserCheck className="size-3 mr-1" />
        {isHost ? "Host" : "Make Host"}
      </Button>
      <Button
        variant={isAdmin ? "accent" : "ghost"}
        size="sm"
        className="h-8 rounded-full text-xs"
        onClick={handleToggleAdmin}
        loading={isPending}
      >
        <Shield className="size-3 mr-1" />
        {isAdmin ? "Admin" : "Make Admin"}
      </Button>
    </div>
  );
}
