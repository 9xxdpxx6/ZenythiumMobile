/**
 * Pagination types
 */

export interface PaginationParams {
  page?: number;
  per_page?: number;
  /** @deprecated Use per_page instead */
  pageSize?: number;
  /** @deprecated Use per_page instead */
  limit?: number;
  offset?: number;
}

/**
 * API pagination meta matching Laravel-style pagination
 * { current_page, last_page, per_page, total, from, to }
 */
export interface ApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

/**
 * Paginated response from API (matches backend format)
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: ApiPaginationMeta;
  message?: string;
}

/**
 * Internal pagination meta (domain-level alias)
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
