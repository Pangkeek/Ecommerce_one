"use client";

import { AccountSkeleton } from "@/components/account-skeleton";
import { useStore } from "@/components/store-provider";

export default function AccountLoading() {
  const { signedIn, locale } = useStore();
  return <AccountSkeleton signedIn={signedIn} locale={locale} />;
}
