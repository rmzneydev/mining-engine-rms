import { Router } from 'express';
import { UserController, authenticate } from '../controllers/user.controller.js';

const userController = new UserController();
const router = Router();

router.get('/', authenticate, userController.getUsers);
router.patch('/:id/role', authenticate, userController.updateUser);

export default router;
