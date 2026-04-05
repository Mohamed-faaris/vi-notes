import { HomeLayout } from "fumadocs-ui/layouts/home";
import { redirect } from "react-router";

import { baseOptions } from "@/lib/layout.shared";

import type { Route } from "./+types/home";

export function loader() {
  return redirect("/docs");
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "VI Notes" },
    { name: "description", content: "VI Notes - Documentation" },
  ];
}

export default function Home() {
  return <HomeLayout {...baseOptions()} />;
}
