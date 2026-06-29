import logo from "@/assets/aria-logo.png";

import { cn } from "@/lib/utils";

export const AriaMark = logo;

export function AriaLogo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <img
        src={logo}
        alt="Aria"
        width={32}
        height={32}
        className="size-8 shrink-0 object-contain"
      />
      {showWordmark && (
        <span className="font-display text-xl font-semibold tracking-tight">Aria</span>
      )}
    </span>
  );
}
