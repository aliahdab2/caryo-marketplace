import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-config";
import DashboardClientLayout from "./layout.client";

export default async function DashboardLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { children } = props;
  const params = await props.params;
  const locale = params?.locale || 'en';

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/${locale}/auth/signin`);
  }

  return (
    <DashboardClientLayout>
      {children}
    </DashboardClientLayout>
  );
}
