import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbsProps {
  activeTab: string;
}

export function Breadcrumbs({ activeTab }: BreadcrumbsProps) {
  const segments = activeTab.split("-");
  
  const getLabel = (segment: string) => {
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <nav className="flex items-center gap-2 text-xs font-medium">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Home className="w-3 h-3" />
        <span>Orbit</span>
      </div>
      
      {segments.map((segment, index) => (
        <div key={segment} className="flex items-center gap-2">
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className={index === segments.length - 1 ? "text-foreground" : "text-muted-foreground"}>
            {getLabel(segment)}
          </span>
        </div>
      ))}
    </nav>
  );
}
