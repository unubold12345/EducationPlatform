import "./home-atmosphere.css";
import "./home-lexlab.css";
import "./home-overview.css";
import { HomeClassic } from "@/components/home-classic";

// The homepage displays the same current plan prices as Workspace checkout.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <HomeClassic />;
}
