import { Router } from 'express';
import { getUsers, updateUser, authenticate } from '../controllers/user.controller.js';

const router = Router();

router.get('/', authenticate, getUsers);
router.patch('/:id/role', authenticate, updateUser);

export default router;
