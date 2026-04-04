import { z } from 'zod';
import { RecordType } from '@prisma/client';

export const createRecordSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    type: z.nativeEnum(RecordType),
    category: z.string().min(1).max(100),
    date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    notes: z.string().max(500).optional(),
  }),
});

export const updateRecordSchema = z.object({
  body: z.object({
    amount: z.number().positive().optional(),
    type: z.nativeEnum(RecordType).optional(),
    category: z.string().min(1).max(100).optional(),
    date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    notes: z.string().max(500).optional().nullable(),
  }).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
});

export const ALLOWED_RECORD_SORT_FIELDS = ['amount', 'date', 'createdAt'] as const;

export const listRecordsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    type: z.nativeEnum(RecordType).optional(),
    category: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().optional(),
  }),
});

export type CreateRecordDto = z.infer<typeof createRecordSchema>['body'];
export type UpdateRecordDto = z.infer<typeof updateRecordSchema>['body'];
export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>['query'];
