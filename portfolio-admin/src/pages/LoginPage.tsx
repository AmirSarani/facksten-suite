import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, TextInput } from "../components/ui";
import { errorMessage, getApiBase } from "../lib/api";
import { useAuth } from "../lib/auth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    location.state && typeof location.state === "object" && "from" in location.state
      ? String((location.state as { from: string }).from)
      : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="hero-circuit flex min-h-screen overflow-x-clip items-center justify-center px-4 py-10">
      <div className="auth-enter panel-card w-full max-w-md p-8">
        <p className="font-mono text-[10px] tracking-[0.28em] text-cta">FACKSTEN // ADMIN</p>
        <h1 className="font-brand mt-2 text-3xl text-on-surface">Sign in</h1>
        <p className="mt-2 text-sm text-on-surface-variant" dir="rtl" lang="fa">
          ورود به پنل مدیریت پورتفولیو
        </p>
        <p className="mt-4 font-mono text-[11px] text-on-surface-variant">
          API {getApiBase()}
        </p>

        <form className="mt-6 space-y-4" onSubmit={(event) => void onSubmit(event)}>
          {error ? <Alert>{error}</Alert> : null}
          <TextInput
            id="email"
            label="Email / ایمیل"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <TextInput
            id="password"
            label="Password / رمز عبور"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Authenticating…" : "Enter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
