import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { redirect } from "next/navigation";

/**
 * Dashboard Root Page
 * Redirects users based on their assigned roles.
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // If no session, the layout/middleware should catch it, but safety first
  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const roles = session.user.roles || [];

  // 1. Admin Priority
  if (roles.includes("ADMIN")) {
    redirect("/dashboard/admin");
  }

  // 2. Dealer Priority
  if (roles.includes("DEALER")) {
    redirect("/dashboard/dealer");
  }

  // 3. Normal User / Buyer Fallback
  // Best Practice: Redirect to Saved Searches ("My Caryo") for immediate engagement
  redirect("/dashboard/saved-searches");
}
