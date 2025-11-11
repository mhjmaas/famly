export default function LogoPage() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-background">
      <div className="flex flex-col items-center gap-8">
        {/* Logo Container - 512px */}
        <div className="w-[512px] h-[512px] relative">
          {/* Top-left circle (Primary color) */}
          <div className="absolute top-0 left-0 w-[320px] h-[320px] rounded-full bg-primary opacity-80" />

          {/* Top-right circle (Chart-2 color) */}
          <div className="absolute top-0 right-0 w-[320px] h-[320px] rounded-full bg-chart-2 opacity-80" />

          {/* Bottom-center circle (Chart-3 color) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full bg-chart-3 opacity-80" />
        </div>

        {/* Text Label */}
        <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
          Famly
        </h1>
      </div>
    </div>
  );
}
