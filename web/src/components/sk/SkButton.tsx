import { LucideIcon, Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

const VARIANT = { primary: "sk-btn", secondary: "sk-btn-secondary", sage: "sk-btn-sage", alarm: "sk-btn-alarm", ghost: "sk-btn-ghost" } as const;
const SIZE = { md: "", lg: "!min-h-[56px] text-lg", xl: "!min-h-[64px] !px-8 text-lg sm:text-xl" } as const;

type Props = {
  variant?: keyof typeof VARIANT; size?: keyof typeof SIZE; icon?: LucideIcon; iconRight?: LucideIcon; loading?: boolean;
  to?: string; href?: string; external?: boolean; children: ReactNode; className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

/** Raised enamel button. Renders <Link>, <a> or <button>. */
export default function SkButton({ variant = "primary", size = "md", icon: Icon, iconRight: IconR, loading, to, href, external, children, className = "", ...rest }: Props) {
  const cls = `${VARIANT[variant]} ${SIZE[size]} ${className}`;
  const inner = (
    <>
      {loading ? <Loader2 className="animate-spin" size={20} aria-hidden /> : Icon && <Icon size={size === "md" ? 20 : 24} aria-hidden />}
      <span>{children}</span>
      {IconR && !loading && <IconR size={size === "md" ? 20 : 24} aria-hidden />}
    </>
  );
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  if (href) return <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>{inner}</a>;
  return <button className={cls} disabled={rest.disabled || loading} {...rest}>{inner}</button>;
}
