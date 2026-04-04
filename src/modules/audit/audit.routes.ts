import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { catchAsync } from '../../utils/catchAsync';
import * as auditController from './audit.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * @openapi
 * /audit-logs:
 *   get:
 *     tags: [Audit Logs]
 *     summary: List audit logs with filtering and pagination (Admin only)
 *     description: Retrieve system audit logs including user actions, resource changes, and timestamps.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default = 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page (max = 100)
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filter by resource type (e.g., USER, RECORD)
 *       - in: query
 *         name: actorId
 *         schema:
 *           type: string
 *         description: Filter by user who performed the action
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs from this date (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs until this date (ISO format)
 *     responses:
 *       200:
 *         description: Paginated audit logs
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - actorId: "user-123"
 *                   actorRole: "ADMIN"
 *                   action: "UPDATE"
 *                   resourceType: "USER"
 *                   resourceId: "abc-123"
 *                   diff:
 *                     name:
 *                       from: "Old Name"
 *                       to: "New Name"
 *                   timestamp: "2026-04-04T12:00:00.000Z"
 *               meta:
 *                 page: 1
 *                 limit: 20
 *                 total: 100
 *                 totalPages: 5
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get('/', catchAsync(auditController.listAuditLogs));

export default router;
