import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/pregled", replace: true });
  }, [navigate]);
  return null;
}
