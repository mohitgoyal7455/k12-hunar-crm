import { pool } from '../db/pool';
import type {
  CreateInquiryInput,
  InquiryFilters,
  ListInquiriesQuery,
  Status,
} from '../schemas/inquiry';
import { AppError } from '../utils/AppError';

export interface Inquiry {
  id: number;
  userType: string;
  category: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const SELECT_COLUMNS = `
  id::int            AS "id",
  user_type          AS "userType",
  category,
  name,
  email,
  phone,
  message,
  status,
  created_at         AS "createdAt",
  updated_at         AS "updatedAt"
`;

// Whitelisted sort columns — user input never reaches the SQL text.
const SORT_COLUMNS: Record<InquiryFilters['sort'], string> = {
  created_at: 'created_at',
  name: 'LOWER(name)',
};

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Builds a parameterised WHERE clause from the dashboard filters. */
function buildWhere(filters: InquiryFilters) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    clauses.push(sql.replace('?', `$${params.length}`));
  };

  if (filters.category) add('category = ?', filters.category);
  if (filters.userType) add('user_type = ?', filters.userType);
  if (filters.status) add('status = ?', filters.status);

  if (filters.search) {
    const term = `%${escapeLike(filters.search)}%`;
    params.push(term);
    const textIdx = params.length;
    const or = [`name ILIKE $${textIdx}`, `email ILIKE $${textIdx}`];

    // "98100 12345" or "+91 98100…" should still match the stored digits.
    const digits = filters.search.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (digits.length >= 3) {
      params.push(`%${digits}%`);
      or.push(`phone LIKE $${params.length}`);
    }
    clauses.push(`(${or.join(' OR ')})`);
  }

  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export async function createInquiry(input: CreateInquiryInput) {
  const { rows } = await pool.query<Inquiry>(
    `INSERT INTO inquiries (user_type, category, name, email, phone, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${SELECT_COLUMNS}`,
    [input.userType, input.category, input.name, input.email, input.phone, input.message],
  );
  return rows[0];
}

export async function listInquiries(query: ListInquiriesQuery) {
  const { page, limit, ...filters } = query;
  const { where, params } = buildWhere(filters);
  const orderBy = `${SORT_COLUMNS[filters.sort]} ${filters.order === 'asc' ? 'ASC' : 'DESC'}, id DESC`;

  const [data, count] = await Promise.all([
    pool.query<Inquiry>(
      `SELECT ${SELECT_COLUMNS}
         FROM inquiries
         ${where}
        ORDER BY ${orderBy}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit],
    ),
    pool.query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM inquiries ${where}`, params),
  ]);

  const total = count.rows[0].total;
  return {
    data: data.rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function exportInquiries(filters: InquiryFilters) {
  const { where, params } = buildWhere(filters);
  const { rows } = await pool.query<Inquiry>(
    `SELECT ${SELECT_COLUMNS}
       FROM inquiries
       ${where}
      ORDER BY ${SORT_COLUMNS[filters.sort]} ${filters.order === 'asc' ? 'ASC' : 'DESC'}, id DESC
      LIMIT 10000`,
    params,
  );
  return rows;
}

export async function getInquiry(id: number) {
  const { rows } = await pool.query<Inquiry>(
    `SELECT ${SELECT_COLUMNS} FROM inquiries WHERE id = $1`,
    [id],
  );
  if (!rows[0]) throw AppError.notFound('Inquiry not found');
  return rows[0];
}

export async function updateStatus(id: number, status: Status) {
  const { rows } = await pool.query<Inquiry>(
    `UPDATE inquiries SET status = $2 WHERE id = $1 RETURNING ${SELECT_COLUMNS}`,
    [id, status],
  );
  if (!rows[0]) throw AppError.notFound('Inquiry not found');
  return rows[0];
}

export async function deleteInquiry(id: number) {
  const { rowCount } = await pool.query('DELETE FROM inquiries WHERE id = $1', [id]);
  if (!rowCount) throw AppError.notFound('Inquiry not found');
}

export async function getStats() {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*)::int                                                     AS "total",
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS "last7Days",
      COUNT(*) FILTER (WHERE status = 'new')::int                       AS "new",
      COUNT(*) FILTER (WHERE status = 'in_progress')::int               AS "inProgress",
      COUNT(*) FILTER (WHERE status = 'resolved')::int                  AS "resolved",
      COUNT(*) FILTER (WHERE status = 'closed')::int                    AS "closed",
      COUNT(*) FILTER (WHERE category = 'scholarship')::int             AS "scholarship",
      COUNT(*) FILTER (WHERE category = 'concert')::int                 AS "concert",
      COUNT(*) FILTER (WHERE category = 'admission')::int               AS "admission",
      COUNT(*) FILTER (WHERE category = 'general_query')::int           AS "generalQuery"
    FROM inquiries
  `);
  const r = rows[0];
  return {
    total: r.total,
    last7Days: r.last7Days,
    byStatus: { new: r.new, in_progress: r.inProgress, resolved: r.resolved, closed: r.closed },
    byCategory: {
      scholarship: r.scholarship,
      concert: r.concert,
      admission: r.admission,
      general_query: r.generalQuery,
    },
  };
}
