import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar todos los usuarios (solo administrador)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       401:
 *         description: No autenticado o usuario inactivo
 *       403:
 *         description: Requiere rol de administrador
 */
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Consultar un usuario por ID (solo administrador)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       401:
 *         description: No autenticado o usuario inactivo
 *       403:
 *         description: Requiere rol de administrador
 *       404:
 *         description: Usuario no encontrado
 *   patch:
 *     summary: Actualizar datos de un usuario (solo administrador)
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 example: juan.perez@empresa.com
 *               role:
 *                 type: string
 *                 enum: [admin, operator]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       400:
 *         description: Error de validación o acción sobre la propia cuenta
 *       401:
 *         description: No autenticado o usuario inactivo
 *       403:
 *         description: Requiere rol de administrador
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: El correo ya está registrado
 */
/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Actualizar rol de un usuario (solo administrador)
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
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autenticado o usuario inactivo
 *       403:
 *         description: Requiere rol de administrador
 *       404:
 *         description: Usuario no encontrado
 */
/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   patch:
 *     summary: Desactivar un usuario (solo administrador)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario desactivado
 *       400:
 *         description: No puede desactivar su propia cuenta
 *       401:
 *         description: No autenticado o usuario inactivo
 *       403:
 *         description: Requiere rol de administrador
 *       404:
 *         description: Usuario no encontrado
 */
/**
 * @swagger
 * /api/users/{id}/activate:
 *   patch:
 *     summary: Reactivar un usuario (solo administrador)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario activado
 *       401:
 *         description: No autenticado o usuario inactivo
 *       403:
 *         description: Requiere rol de administrador
 *       404:
 *         description: Usuario no encontrado
 */

const userController = new UserController();
const router = Router();
const requireAdmin = authorize('admin');

router.get('/', authenticate, requireAdmin, userController.getUsers);

router.patch('/:id/deactivate', authenticate, requireAdmin, userController.deactivateUser);
router.patch('/:id/activate', authenticate, requireAdmin, userController.activateUser);
router.patch('/:id/role', authenticate, requireAdmin, userController.updateRole);

router.get('/:id', authenticate, requireAdmin, userController.getUser);
router.patch('/:id', authenticate, requireAdmin, userController.updateUser);

export default router;
