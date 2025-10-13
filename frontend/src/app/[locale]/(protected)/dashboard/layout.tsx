import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-config";
import DashboardClientLayout from "./layout.client";

export default async function DashboardLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const { children } = props;
  const maybeParams = props?.params;
  const params = (maybeParams && 'then' in maybeParams) ? await maybeParams : maybeParams;
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
