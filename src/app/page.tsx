import "./home-atmosphere.css";
import "./home-lexlab.css";
import "./home-sheet.css";
import { HomeSheet } from "@/components/home-sheet";

// The homepage displays the same current plan prices as Workspace checkout.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <HomeSheet />;
}
