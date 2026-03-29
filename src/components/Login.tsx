import { FormEvent, useState } from "react";
import { ArrowRight, Mail } from "lucide-react";

import { AuthShell } from "./shared/AuthShell";
import { InlineAlert } from "./shared/States";

type LoginProps = {
  defaultEmail?: string;
  isSubmitting?: boolean;
  error?: string | null;
  info?: string | null;
  onSubmit: (email: string) => Promise<void> | void;
};

export function Login({
  defaultEmail = "",
  isSubmitting = false,
  error,
  info,
  onSubmit,
}: LoginProps) {
  const [email, setEmail] = useState(defaultEmail);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(email.trim());
  }

  return (
    <AuthShell
      title="Admin Sign In"
      description="Enter your authorized email address to receive a one-time login code."
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-on-surface mb-1">Welcome back</h2>
        <p className="text-on-surface-variant text-sm">
          Two-step verification is required for every admin session.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <InlineAlert message={error} tone="error" />
        <InlineAlert message={info} tone="success" />

        <div className="space-y-2">
          <label
            className="block text-[11px] font-bold text-outline uppercase tracking-wider"
            htmlFor="email"
          >
            Work Email
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="name@company.com"
              className="w-full h-12 px-4 bg-surface-container-low border-0 focus:ring-2 focus:ring-primary/20 rounded-lg text-on-surface placeholder:text-outline/50 transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-outline/40" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-gradient-to-br from-[#004ac6] to-[#2563eb] text-on-primary font-semibold rounded-lg shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isSubmitting ? "Sending code..." : "Send Code"}
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </AuthShell>
  );
}
