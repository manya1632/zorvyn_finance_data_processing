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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 1000
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Salary
 *               date:
 *                 type: string
 *                 description: ISO datetime OR YYYY-MM-DD
 *                 example: 2026-04-04
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 example: Monthly salary
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authorize('ADMIN'), catchAsync(recordsController.createRecord));


/**
 * @openapi
 * /records/{id}:
 *   put:
 *     tags: [Records]
 *     summary: Update financial record (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       description: At least one field must be provided
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               date:
 *                 type: string
 *                 description: ISO datetime OR YYYY-MM-DD
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Record updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Record not found
 */
router.get('/', authorize('ANALYST', 'ADMIN'), catchAsync(recordsController.listRecords));

/**
 * @openapi
 * /records:
 *   get:
 *     tags: [Records]
 *     summary: List financial records (Analyst, Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         example: "1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         example: "10"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: amount:desc
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           example: 2026-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           example: 2026-12-31
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated record list
 */
router.get('/:id', authorize('ANALYST', 'ADMIN'), catchAsync(recordsController.getRecordById));

/**
 * @openapi
 * /records/{id}:
 *   get:
 *     tags: [Records]
 *     summary: Get record by ID (Analyst, Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record fetched successfully
 *       404:
 *         description: Record not found
 */
router.put('/:id', authorize('ADMIN'), catchAsync(recordsController.updateRecord));

/**
 * @openapi
 * /records/{id}:
 *   delete:
 *     tags: [Records]
 *     summary: Soft delete a financial record (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 message: Record deleted
 */
router.delete('/:id', authorize('ADMIN'), catchAsync(recordsController.deleteRecord));

export default router;
