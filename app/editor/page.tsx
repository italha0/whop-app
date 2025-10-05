"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { MainLayout } from "@/components/layout/MainLayout";

export default function EditorPage() {
  const { user } = useAppStore();
  const router = useRouter();


  // Auth is now optional. Show editor for all users.

  return <MainLayout />;
}
