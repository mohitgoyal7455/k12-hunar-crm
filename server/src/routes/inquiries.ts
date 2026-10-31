import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { inquiryLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import {
  createInquirySchema,
  idParamSchema,
  listInquiriesQuerySchema,
  updateStatusSchema,
  type CreateInquiryInput,
  type ListInquiriesQuery,
} from '../schemas/inquiry';
import * as inquiryService from '../services/inquiryService';
import { toCsv } from '../utils/csv';

export const inquiriesRouter = Router();

// ---------------------------------------------------------------- public

/** POST /api/inquiries — public inquiry form submission */
inquiriesRouter.post('/', inquiryLimiter, validate(createInquirySchema), async (_req, res) => {
  const input: CreateInquiryInput = res.locals.body;

  // Honeypot filled → almost certainly a bot. Pretend success, store nothing.
  if (input.website) {
    return res.status(201).json({ id: 0, reference: 'INQ-000000', message: 'Inquiry received' });
  }

  const inquiry = await inquiryService.createInquiry(input);
  res.status(201).json({
    id: inquiry.id,
    reference: `INQ-${String(inquiry.id).padStart(6, '0')}`,
    message: 'Inquiry received',
  });
});

// ----------------------------------------------------------- admin only
inquiriesRouter.use(requireAuth);

/** GET /api/inquiries — paginated, filterable, searchable list */
inquiriesRouter.get('/', validate(listInquiriesQuerySchema, 'query'), async (_req, res) => {
  res.json(await inquiryService.listInquiries(res.locals.query));
});

/** GET /api/inquiries/stats — summary counts for the dashboard */
inquiriesRouter.get('/stats', async (_req, res) => {
  res.json(await inquiryService.getStats());
});

/** GET /api/inquiries/export — CSV of the current filtered view */
inquiriesRouter.get('/export', validate(listInquiriesQuerySchema, 'query'), async (_req, res) => {
  const { page: _p, limit: _l, ...filters } = res.locals.query as ListInquiriesQuery;
  const rows = await inquiryService.exportInquiries(filters);
  const csv = toCsv(
    ['ID', 'Name', 'Email', 'Phone', 'User Type', 'Category', 'Status', 'Message', 'Submitted At'],
    rows.map((r) => [
      r.id, r.name, r.email, r.phone, r.userType, r.category, r.status, r.message,
      new Date(r.createdAt).toISOString(),
    ]),
  );
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="inquiries-${stamp}.csv"`);
  res.send(csv);
});

/** GET /api/inquiries/:id */
inquiriesRouter.get('/:id', validate(idParamSchema, 'params'), async (_req, res) => {
  res.json(await inquiryService.getInquiry(res.locals.params.id));
});

/** PATCH /api/inquiries/:id/status */
inquiriesRouter.patch(
  '/:id/status',
  validate(idParamSchema, 'params'),
  validate(updateStatusSchema),
  async (_req, res) => {
    res.json(await inquiryService.updateStatus(res.locals.params.id, res.locals.body.status));
  },
);

/** DELETE /api/inquiries/:id */
inquiriesRouter.delete('/:id', validate(idParamSchema, 'params'), async (_req, res) => {
  await inquiryService.deleteInquiry(res.locals.params.id);
  res.status(204).end();
});
