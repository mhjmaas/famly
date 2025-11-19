"use client";

import Link from "next/link";

interface LogoComponentProps {
  showText?: boolean;
  href?: string;
  onClick?: (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => void;
  testId?: string;
}

export function LogoComponent({
  showText = true,
  href,
  onClick,
  testId = "logo",
}: LogoComponentProps) {
  const logoContent = (
    <>
      <div className="relative w-8 h-8">
        <div className="absolute top-0 left-0 w-5 h-5 rounded-full bg-primary opacity-80 transition-transform group-hover:scale-110" />
        <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-chart-2 opacity-80 transition-transform group-hover:scale-110" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-chart-3 opacity-80 transition-transform group-hover:scale-110" />
      </div>
      {showText && (
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
          Famly
        </span>
      )}
    </>
  );

  // Render as button if no href is provided, otherwise render as link
  if (!href) {
    return (
      <button
        type="button"
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        className="flex items-center gap-2 group"
        data-testid={testId}
      >
        {logoContent}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-2 group"
      onClick={onClick}
      data-testid={testId}
    >
      {logoContent}
    </Link>
  );
}
