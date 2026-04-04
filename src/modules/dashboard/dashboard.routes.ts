import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { catchAsync } from '../../utils/catchAsync';
import * as dashboardController from './dashboard.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('VIEWER', 'ANALYST', 'ADMIN'));

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Summary data
 */
router.get('/summary', catchAsync(dashboardController.getSummary));

/**
 * @openapi
 * /dashboard/category-breakdown:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get category breakdown
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Category breakdown data
 */
router.get('/category-breakdown', catchAsync(dashboardController.getCategoryBreakdown));

/**
 * @openapi
 * /dashboard/monthly-trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get monthly trends
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Monthly trends data
 */
router.get('/monthly-trends', catchAsync(dashboardController.getMonthlyTrends));

/**
 * @openapi
 * /dashboard/recent-activity:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent activity
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Recent activity data
 */
router.get('/recent-activity', catchAsync(dashboardController.getRecentActivity));

export default router;
