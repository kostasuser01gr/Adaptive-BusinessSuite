/**
 * Fine-grained RBAC permission model.
 */

export enum Permission {
  // Vehicles
  READ_VEHICLES = "read:vehicles",
  CREATE_VEHICLES = "create:vehicles",
  UPDATE_VEHICLES = "update:vehicles",
  DELETE_VEHICLES = "delete:vehicles",

  // Bookings
  READ_BOOKINGS = "read:bookings",
  CREATE_BOOKINGS = "create:bookings",
  UPDATE_BOOKINGS = "update:bookings",
  APPROVE_BOOKINGS = "approve:bookings",
  CANCEL_BOOKINGS = "cancel:bookings",

  // Customers
  READ_CUSTOMERS = "read:customers",
  CREATE_CUSTOMERS = "create:customers",
  UPDATE_CUSTOMERS = "update:customers",
  DELETE_CUSTOMERS = "delete:customers",

  // Tasks & Notes
  READ_TASKS = "read:tasks",
  MANAGE_TASKS = "manage:tasks",
  READ_NOTES = "read:notes",
  MANAGE_NOTES = "manage:notes",

  // Maintenance
  READ_MAINTENANCE = "read:maintenance",
  MANAGE_MAINTENANCE = "manage:maintenance",

  // Reports & Analytics
  READ_REPORTS = "read:reports",
  EXPORT_REPORTS = "export:reports",

  // Admin
  MANAGE_USERS = "manage:users",
  MANAGE_PERMISSIONS = "manage:permissions",
  VIEW_ADMIN = "view:admin",

  // API Keys
  MANAGE_API_KEYS = "manage:api_keys",

  // Webhooks
  MANAGE_WEBHOOKS = "manage:webhooks",

  // Analytics
  VIEW_ANALYTICS = "view:analytics",

  // Automations
  MANAGE_AUTOMATIONS = "manage:automations",

  // Audit
  VIEW_AUDIT_LOG = "view:audit_log",
}

export type UserRole = "admin" | "operator" | "driver" | "viewer";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: Object.values(Permission),

  operator: [
    Permission.READ_VEHICLES,
    Permission.CREATE_VEHICLES,
    Permission.UPDATE_VEHICLES,
    Permission.READ_BOOKINGS,
    Permission.CREATE_BOOKINGS,
    Permission.UPDATE_BOOKINGS,
    Permission.APPROVE_BOOKINGS,
    Permission.READ_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.UPDATE_CUSTOMERS,
    Permission.READ_TASKS,
    Permission.MANAGE_TASKS,
    Permission.READ_NOTES,
    Permission.MANAGE_NOTES,
    Permission.READ_MAINTENANCE,
    Permission.MANAGE_MAINTENANCE,
    Permission.READ_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_AUTOMATIONS,
  ],

  driver: [
    Permission.READ_VEHICLES,
    Permission.READ_BOOKINGS,
    Permission.READ_TASKS,
    Permission.MANAGE_TASKS,
    Permission.READ_NOTES,
    Permission.MANAGE_NOTES,
    Permission.READ_MAINTENANCE,
  ],

  viewer: [
    Permission.READ_VEHICLES,
    Permission.READ_BOOKINGS,
    Permission.READ_CUSTOMERS,
    Permission.READ_TASKS,
    Permission.READ_NOTES,
    Permission.READ_MAINTENANCE,
    Permission.READ_REPORTS,
    Permission.VIEW_ANALYTICS,
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role as UserRole];
  return perms ? perms.includes(permission) : false;
}
