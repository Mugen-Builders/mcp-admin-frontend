import { FormEvent, useState } from "react";
import { ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";

import { AuthShell } from "./shared/AuthShell";
import { InlineAlert } from "./shared/States";

type OtpValidationProps = {
  email: string;
  isSubmitting?: boolean;
  isResending?: boolean;
  error?: string | null;
  info?: string | null;
  onBack: () => void;
  onResend: () => Promise<void> | void;
  onSubmit: (code: string) => Promise<void> | void;
};

export function OtpValidation({
  email,
  isSubmitting = false,
  isResending = false,
  error,
  info,
  onBack,
  onResend,
  onSubmit,
}: OtpValidationProps) {
  const [code, setCode] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(code.trim());
  }

  return (
    <AuthShell
      eyebrow="Cartesi MCP OTP"
      title="Verify Your Login Code"
      description="Use the one-time code sent to your email to continue to the admin workspace."
    >
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
        <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-on-surface">
            Email verification required
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            We sent a short-lived OTP to{" "}
            <span className="font-semibold text-on-surface">{email}</span>.
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <InlineAlert message={error} tone="error" />
        {/* <InlineAlert message={info} tone="success" /> */}

        <div className="space-y-2">
          <label
            className="block text-[11px] font-bold text-outline uppercase tracking-wider"
            htmlFor="otp"
          >
            Verification Code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\s+/g, "").slice(0, 16))
            }
            required
            placeholder="Enter OTP"
            className="w-full h-12 px-4 bg-surface-container-low border-0 focus:ring-2 focus:ring-primary/20 rounded-lg text-on-surface tracking-[0.3em] font-semibold placeholder:text-outline/50 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-gradient-to-br from-[#004ac6] to-[#2563eb] text-on-primary font-semibold rounded-lg shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {isSubmitting ? "Verifying..." : "Verify and Continue"}
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Change email
          </button>

          <button
            type="button"
            onClick={() => void onResend()}
            disabled={isResending}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-70"
          >
            <RefreshCw
              className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`}
            />
            {isResending ? "Resending..." : "Resend code"}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
