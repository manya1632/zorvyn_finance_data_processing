import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { catchAsync } from '../../utils/catchAsync';
import * as recordsController from './records.controller';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /records:
 *   post:
 *     tags: [Records]
 *     summary: Create a financial record (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Record created }
 *       400: { description: Validation error }
 */
router.post('/', authorize('ADMIN'), catchAsync(recordsController.createRecord));

/**
 * @openapi
 * /records:
 *   get:
 *     tags: [Records]
 *     summary: List financial records with pagination, filtering, sorting, search (Analyst, Admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated record list }
 */
router.get('/', authorize('ANALYST', 'ADMIN'), catchAsync(recordsController.listRecords));
router.get('/:id', authorize('ANALYST', 'ADMIN'), catchAsync(recordsController.getRecordById));
router.put('/:id', authorize('ADMIN'), catchAsync(recordsController.updateRecord));
router.delete('/:id', authorize('ADMIN'), catchAsync(recordsController.deleteRecord));

export default router;
