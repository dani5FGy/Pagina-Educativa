import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { query, insert, findByField, update } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Middleware para validar tokens JWT
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'maxwavex_secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Validaciones para registro
const registerValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Validaciones para login
const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('password')
        .notEmpty()
        .withMessage('Contraseña requerida')
];

// Registro de usuarios
router.post('/register', registerValidation, async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: errors.array()
            });
        }

        const { name, email, password } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await findByField('users', 'email', email);
        if (existingUser) {
            return res.status(409).json({
                error: 'El email ya está registrado'
            });
        }

        // Hashear la contraseña
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insertar nuevo usuario
        const userData = {
            name: name.trim(),
            email: email.toLowerCase(),
            password_hash: passwordHash,
            user_type: 'student',
            created_at: new Date(),
            is_active: true
        };

        const result = await insert('users', userData);

        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: result.insertId, 
                email: email.toLowerCase(),
                userType: 'student'
            },
            process.env.JWT_SECRET || 'maxwavex_secret_key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                id: result.insertId,
                name: name.trim(),
                email: email.toLowerCase(),
                userType: 'student'
            },
            token
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Login de usuarios
router.post('/login', loginValidation, async (req, res) => {
    try {
        // Verificar errores de validación
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: errors.array()
            });
        }

        const { email, password } = req.body;

        // Buscar usuario
        const user = await findByField('users', 'email', email.toLowerCase());
        if (!user) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // Verificar si el usuario está activo
        if (!user.is_active) {
            return res.status(401).json({
                error: 'Cuenta desactivada'
            });
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // Actualizar último login
        await update('users', user.id, { last_login: new Date() });

        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email,
                userType: user.user_type
            },
            process.env.JWT_SECRET || 'maxwavex_secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login exitoso',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                userType: user.user_type
            },
            token
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Crear sesión de invitado
router.post('/guest', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.trim().length < 2) {
            return res.status(400).json({
                error: 'Nombre de usuario requerido (mínimo 2 caracteres)'
            });
        }

        // Generar ID de sesión único
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 3600000); // 1 hora

        // Insertar sesión de invitado
        const guestData = {
            session_id: sessionId,
            username: username.trim(),
            created_at: new Date(),
            expires_at: expiresAt,
            is_active: true
        };

        const result = await insert('guest_sessions', guestData);

        // Generar token para invitado
        const token = jwt.sign(
            { 
                guestId: result.insertId,
                sessionId: sessionId,
                username: username.trim(),
                userType: 'guest'
            },
            process.env.JWT_SECRET || 'maxwavex_secret_key',
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Sesión de invitado creada',
            guest: {
                id: result.insertId,
                sessionId: sessionId,
                username: username.trim(),
                userType: 'guest',
                expiresAt: expiresAt
            },
            token
        });

    } catch (error) {
        console.error('Error creando sesión de invitado:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Verificar token
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        if (req.user.userType === 'guest') {
            // Verificar sesión de invitado
            const guest = await query(
                'SELECT * FROM guest_sessions WHERE id = ? AND is_active = true AND expires_at > NOW()',
                [req.user.guestId]
            );

            if (!guest[0]) {
                return res.status(401).json({
                    error: 'Sesión de invitado expirada'
                });
            }

            res.json({
                valid: true,
                user: {
                    id: guest[0].id,
                    sessionId: guest[0].session_id,
                    username: guest[0].username,
                    userType: 'guest'
                }
            });
        } else {
            // Verificar usuario registrado
            const user = await findByField('users', 'id', req.user.userId);
            
            if (!user || !user.is_active) {
                return res.status(401).json({
                    error: 'Usuario no encontrado o inactivo'
                });
            }

            res.json({
                valid: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    userType: user.user_type
                }
            });
        }

    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        if (req.user.userType === 'guest') {
            // Desactivar sesión de invitado
            await update('guest_sessions', req.user.guestId, { is_active: false });
        }

        res.json({
            message: 'Logout exitoso'
        });

    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

export default router;