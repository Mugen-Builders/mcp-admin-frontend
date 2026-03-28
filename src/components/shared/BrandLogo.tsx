import logoUrl from '../../img/mcp-logo.png';

type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
};

const SIZE_STYLES = {
  sm: {
    icon: 'h-11 w-11',
    title: 'text-sm',
    subtitle: 'text-[10px]',
    gap: 'gap-3',
  },
  md: {
    icon: 'h-12 w-12',
    title: 'text-base',
    subtitle: 'text-[10px]',
    gap: 'gap-3',
  },
  lg: {
    icon: 'h-[72px] w-[72px]',
    title: 'text-lg',
    subtitle: 'text-[11px]',
    gap: 'gap-4',
  },
} as const;

export function BrandLogo({
  size = 'md',
  showWordmark = true,
  className = '',
}: BrandLogoProps) {
  const styles = SIZE_STYLES[size];

  return (
    <div className={`flex items-center ${styles.gap} ${className}`}>
      <div className={`flex items-center justify-center overflow-hidden shrink-0 ${styles.icon}`}>
        <img src={logoUrl} alt="Cartesi MCP" className="h-full w-full object-contain" />
      </div>
      {showWordmark ? (
        <div>
          <h1 className={`font-black text-white uppercase tracking-tight leading-tight ${styles.title}`}>
            Cartesi MCP
          </h1>
          <p className={`font-semibold uppercase tracking-[0.18em] text-slate-400 mt-0.5 ${styles.subtitle}`}>
            Admin Dashboard
          </p>
        </div>
      ) : null}
    </div>
  );
}
