import { ReactNode } from "react";

import { BrandLogo } from "./BrandLogo";

type AuthShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  eyebrow = "Cartesi MCP",
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface text-on-background relative overflow-hidden">
      <div className="fixed top-6 right-6">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-surface-container-high text-on-surface-variant ring-1 ring-outline-variant/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
          Admin Access
        </span>
      </div>

      <main className="w-full max-w-[460px] flex flex-col items-center z-10">
        <header className="text-center mb-10">
          <div className="mb-5 flex items-center justify-center">
            <BrandLogo size="lg" showWordmark={false} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-3">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">
            {title}
          </h1>
          {/* <p className="text-on-surface-variant text-sm font-medium">{description}</p> */}
        </header>

        <section className="w-full bg-surface-container-lowest rounded-xl p-8 shadow-[0_12px_32px_rgba(23,28,31,0.06)] ring-1 ring-outline-variant/10">
          {children}
        </section>

        <footer className="mt-12 text-center">
          {footer ?? (
            <>
              <p className="text-[10px] text-outline font-medium uppercase tracking-[0.2em]">
                Secure Internal Access
              </p>
              <div className="mt-4 flex gap-4 justify-center">
                <span className="text-outline text-[11px]">
                  OTP-enabled authentication
                </span>
                <span className="w-1 h-1 rounded-full bg-outline-variant mt-1.5" />
                <span className="text-outline text-[11px]">
                  Responsive admin workspace
                </span>
              </div>
            </>
          )}
        </footer>
      </main>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-fixed/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[30%] h-[30%] bg-secondary-fixed/30 blur-[100px] rounded-full" />
      </div>
    </div>
  );
}
