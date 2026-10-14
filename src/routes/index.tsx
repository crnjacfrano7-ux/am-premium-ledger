import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Evidencija stanova · AM Premium" },
      { name: "description", content: "AM Premium evidencija stanova i uplata po zgradama." },
      { property: "og:title", content: "Evidencija stanova · AM Premium" },
      { property: "og:description", content: "AM Premium evidencija stanova i uplata po zgradama." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/pregled", replace: true });
  }, [navigate]);
  return null;
}
