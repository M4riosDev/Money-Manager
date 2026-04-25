"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function DashboardClient({ userId }: { userId: string }) {
  const router = useRouter();
  useEffect(() => { router.push("/dashboard/expenses"); }, [router]);
  return null;
}
