import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { catchAsync } from '../../utils/catchAsync';
import * as usersController from './users.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: User created }
 *       400: { description: Validation error }
 *       409: { description: Email conflict }
 */
router.post('/', catchAsync(usersController.createUser));

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users with pagination, filtering, sorting, search (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *         description: "Format: field:asc or field:desc"
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [VIEWER, ANALYST, ADMIN] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated user list }
 */
router.get('/', catchAsync(usersController.listUsers));
router.get('/:id', catchAsync(usersController.getUserById));
router.put('/:id', catchAsync(usersController.updateUser));
router.delete('/:id', catchAsync(usersController.deleteUser));
router.patch('/:id/status', catchAsync(usersController.updateUserStatus));

export default router;
