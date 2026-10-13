import { notFound } from "next/navigation";

// Catches every URL no other route matches, so the 404 renders inside the
// (app) layout (sidebar, top bar) with app/(app)/not-found.tsx. Without it,
// unknown URLs fall through to the root default, which has no shell.
export default function UnknownRoute() {
  notFound();
}
