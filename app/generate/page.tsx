import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function GeneratePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/generate");

  return (
    <main style={{ padding: 24 }}>
      <h1>Generate</h1>
      <p>This is the generator page. Hook your planner UI here.</p>
      <a href="/itinerary">Go to itinerary</a>
    </main>
  );
}