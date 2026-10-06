import Link from "next/link";
import { ui } from "@/data/content/platform";
export default function NotFound() {
  return (
    <main className="container public-page">
      <p className="eyebrow">404</p>
      <h1>{ui.tour.notFound}</h1>
      <p>{ui.tour.unavailable}</p>
      <Link className="button" href="/">
        {ui.home}
      </Link>
    </main>
  );
}
