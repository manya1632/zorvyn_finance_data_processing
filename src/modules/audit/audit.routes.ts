import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { catchAsync } from '../../utils/catchAsync';
import * as auditController from './audit.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', catchAsync(auditController.listAuditLogs));

export default router;
