import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-config";
import DashboardClientLayout from "./layout.client";

export default async function DashboardLayout(props: any) {
  const { children } = props;
  const maybeParams = props?.params;
  const params = (maybeParams && typeof maybeParams.then === 'function') ? await maybeParams : maybeParams;
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
