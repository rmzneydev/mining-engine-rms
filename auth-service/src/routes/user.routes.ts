import { Router } from 'express';
import { UserController, authenticate } from '../controllers/user.controller.js';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       401:
 *         description: No autenticado
 */
/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Actualizar rol de un usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, operator]
 *                 example: operator
 *     responses:
 *       200:
 *         description: Rol actualizado
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Usuario no encontrado
 *       400:
 *         description: Error de validación
 */

const userController = new UserController();
const router = Router();

router.get('/', authenticate, userController.getUsers);
router.patch('/:id/role', authenticate, userController.updateUser);

export default router;
