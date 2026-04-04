import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { catchAsync } from '../../utils/catchAsync';
import * as dashboardController from './dashboard.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('VIEWER', 'ANALYST', 'ADMIN'));

router.get('/summary', catchAsync(dashboardController.getSummary));
router.get('/category-breakdown', catchAsync(dashboardController.getCategoryBreakdown));
router.get('/monthly-trends', catchAsync(dashboardController.getMonthlyTrends));
router.get('/recent-activity', catchAsync(dashboardController.getRecentActivity));

export default router;
