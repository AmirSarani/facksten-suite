import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "ورود" };

function LoginFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-container-low">
      <div className="h-10 w-10 animate-pulse rounded-full bg-primary-container/30" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
