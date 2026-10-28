import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario con rol operator
 *     description: El rol siempre es operator; solo un administrador puede cambiarlo desde /api/users/{id}/role.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 example: juan.perez@empresa.com
 *               password:
 *                 type: string
 *                 example: Minero2024!
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       409:
 *         description: El correo ya está registrado
 *       400:
 *         description: Error de validación
 */
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión y obtener JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: juan.perez@empresa.com
 *               password:
 *                 type: string
 *                 example: Minero2024!
 *     responses:
 *       200:
 *         description: Autenticación exitosa, devuelve JWT
 *       401:
 *         description: Credenciales inválidas
 *       400:
 *         description: Error de validación
 */
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado
 *       401:
 *         description: No autenticado
 */

const authController = new AuthController();
const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);

export default router;
