"use client";

import { useState } from "react";
import type { Role } from "@/lib/roles";
import RolePicker from "@/components/RolePicker";
import AuthCard from "@/components/AuthCard";

export default function Home() {
  const [role, setRole] = useState<Role | null>(null);

  if (!role) {
    return <RolePicker onSelect={setRole} />;
  }

  return <AuthCard role={role} onBack={() => setRole(null)} />;
}
