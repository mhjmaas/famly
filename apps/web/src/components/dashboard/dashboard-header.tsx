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
    <div className="hidden lg:block">
      <h1 className="text-3xl font-bold">
        {welcomeMessage.replace("{name}", firstName)}
      </h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );
}
