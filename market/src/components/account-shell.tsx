import { AccountShellClient } from "@/components/account-shell-client";
import { requireUser } from "@/lib/auth";

export async function AccountShell({
  title,
  subtitle,
  children,
  active,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  active?: string;
  actions?: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <AccountShellClient
      title={title}
      subtitle={subtitle}
      active={active}
      actions={actions}
      user={user ? { name: user.name, email: user.email } : null}
    >
      {children}
    </AccountShellClient>
  );
}
