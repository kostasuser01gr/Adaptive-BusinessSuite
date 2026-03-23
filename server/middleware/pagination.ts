import type { Request, Response, NextFunction } from "express";

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order: "asc" | "desc";
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Parse pagination query parameters from request.
 * If no pagination params are provided, returns null (backward-compatible).
 */
export function parsePagination(req: Request): PaginationParams | null {
  const { page, limit, sort, order, search } = req.query;

  // If no pagination params at all, return null for backward compatibility
  if (!page && !limit) return null;

  const parsedPage = Math.max(1, parseInt(String(page || "1"), 10) || 1);
  const parsedLimit = Math.min(
    100,
    Math.max(1, parseInt(String(limit || "25"), 10) || 25),
  );
  const parsedOrder =
    String(order || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  return {
    page: parsedPage,
    limit: parsedLimit,
    sort: sort ? String(sort) : undefined,
    order: parsedOrder as "asc" | "desc",
    search: search ? String(search) : undefined,
  };
}

/**
 * Build a paginated response from data and params.
 */
export function paginateArray<T>(
  data: T[],
  params: PaginationParams,
): PaginatedResponse<T> {
  const total = data.length;
  const totalPages = Math.ceil(total / params.limit);
  const offset = (params.page - 1) * params.limit;
  const paged = data.slice(offset, offset + params.limit);

  return {
    data: paged,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasMore: params.page < totalPages,
    },
  };
}

/**
 * Express middleware that attaches pagination params to req.
 */
export function withPagination(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  (req as any).pagination = parsePagination(req);
  next();
}
