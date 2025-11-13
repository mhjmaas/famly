interface DashboardHeaderProps {
  firstName: string;
  welcomeMessage: string;
  subtitle: string;
}

export function DashboardHeader({
  firstName,
  welcomeMessage,
  subtitle,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="hidden md:block text-3xl font-bold">
        {welcomeMessage.replace("{name}", firstName)}
      </h1>
      <p className="text-muted-foreground text-center md:text-left">
        {subtitle}
      </p>
    </div>
  );
}
