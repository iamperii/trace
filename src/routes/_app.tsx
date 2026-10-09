import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/tg/AppShell";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});
