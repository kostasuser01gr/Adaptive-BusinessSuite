import { useLocation, Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUTE_LABELS: Record<string, string> = {
  "": "Dashboard",
  fleet: "Fleet",
  bookings: "Bookings",
  customers: "Customers",
  tasks: "Tasks",
  notes: "Notes",
  maintenance: "Maintenance",
  settings: "Settings",
  financial: "Financial",
  "nexus-ultra": "Nexus Ultra",
  auth: "Login",
};

function toLabel(segment: string): string {
  return (
    ROUTE_LABELS[segment] ||
    segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export default function Breadcrumbs() {
  const [location] = useLocation();

  if (location === "/" || location === "/auth") return null;

  const segments = location.replace(/^\//, "").split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => ({
    label: toLabel(seg),
    path: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;

        return (
          <span key={crumb.path} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            {isLast ? (
              <span className="text-foreground font-medium text-xs">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.path}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors text-xs"
                )}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
