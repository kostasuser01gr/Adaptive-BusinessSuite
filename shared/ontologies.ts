export interface NavigationLink {
  icon: string;
  label: string;
  path: string;
  modes?: string[];
  always?: boolean;
}

export interface Ontology {
  id: string;
  label: string;
  resourceName: string; // e.g. Vehicle
  eventName: string; // e.g. Booking
  navigation: NavigationLink[];
}

export const ontologies: Record<string, Ontology> = {
  rental: {
    id: "rental",
    label: "Car Rental",
    resourceName: "Vehicle",
    eventName: "Booking",
    navigation: [
      { icon: "LayoutDashboard", label: "Dashboard", path: "/", always: true },
      { icon: "CarFront", label: "Fleet", path: "/fleet" },
      { icon: "Calendar", label: "Bookings", path: "/bookings" },
      { icon: "Users", label: "Customers", path: "/customers" },
      { icon: "Wrench", label: "Maintenance", path: "/maintenance" },
      { icon: "CheckSquare", label: "Tasks", path: "/tasks", always: true },
      { icon: "FileText", label: "Notes", path: "/notes", always: true },
      { icon: "Wallet", label: "Financial", path: "/financial" },
      {
        icon: "Shield",
        label: "NEXUS ULTRA",
        path: "/nexus-ultra",
        always: true,
      },
      { icon: "Settings", label: "Settings", path: "/settings", always: true },
    ],
  },
  personal: {
    id: "personal",
    label: "Personal",
    resourceName: "Asset",
    eventName: "Event",
    navigation: [
      { icon: "LayoutDashboard", label: "Overview", path: "/", always: true },
      {
        icon: "CheckSquare",
        label: "To-Do List",
        path: "/tasks",
        always: true,
      },
      { icon: "FileText", label: "Quick Notes", path: "/notes", always: true },
      { icon: "Calendar", label: "Calendar", path: "/calendar" },
      { icon: "Wallet", label: "Budget", path: "/financial" },
      {
        icon: "Shield",
        label: "NEXUS ULTRA",
        path: "/nexus-ultra",
        always: true,
      },
      { icon: "Settings", label: "Settings", path: "/settings", always: true },
    ],
  },
  professional: {
    id: "professional",
    label: "Professional",
    resourceName: "Project",
    eventName: "Task",
    navigation: [
      { icon: "LayoutDashboard", label: "Dashboard", path: "/", always: true },
      { icon: "Briefcase", label: "Projects", path: "/projects" },
      { icon: "Users", label: "CRM", path: "/customers" },
      { icon: "CheckSquare", label: "Tasks", path: "/tasks", always: true },
      {
        icon: "FileText",
        label: "Knowledge Base",
        path: "/notes",
        always: true,
      },
      { icon: "Wallet", label: "Invoicing", path: "/financial" },
      {
        icon: "Shield",
        label: "NEXUS ULTRA",
        path: "/nexus-ultra",
        always: true,
      },
      { icon: "Settings", label: "Settings", path: "/settings", always: true },
    ],
  },
};

export const defaultOntology = ontologies.rental;
