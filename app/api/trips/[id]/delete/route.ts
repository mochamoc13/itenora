import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = createSupabaseServerClient();

  await supabase
    .from("itineraries")
    .delete()
    .eq("id", params.id)
    .eq("user_id", userId);

  redirect("/itinerary");
}