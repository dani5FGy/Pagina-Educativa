import express from 'express';
import { query, insert, update, findById } from '../config/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Middleware: solo usuarios registrados pueden tener progreso
const requireRegisteredUser = (req, res, next) => {
    if (req.user.userType === 'guest') {
        return res.status(403).json({
            error: 'Los invitados no pueden guardar progreso',
            message: 'Crea una cuenta para guardar tu progreso'
        });
    }
    next();
};

// Obtener progreso del usuario
router.get('/', authenticateToken, requireRegisteredUser, async (req, res) => {
    try {
        const userId = req.user.userId;

        const progress = await query(`
            SELECT 
                up.id,
                up.module_id,
                up.completion_percentage,
                up.time_spent,
                up.last_accessed,
                up.is_completed,
                up.score,
                m.title as module_title,
                m.content_type,
                m.difficulty_level
            FROM user_progress up
            JOIN modules m ON up.module_id = m.id
            WHERE up.user_id = ?
            ORDER BY m.order_index ASC
        `, [userId]);

        res.json(progress);
    } catch (error) {
        console.error('Error obteniendo progreso:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Obtener progreso de un módulo específico
router.get('/:moduleId', authenticateToken, requireRegisteredUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { moduleId } = req.params;

        // Verificar que el módulo existe
        const module = await findById('modules', moduleId);
        if (!module) {
            return res.status(404).json({
                error: 'Módulo no encontrado'
            });
        }

        const progress = await query(`
            SELECT 
                up.*,
                m.title as module_title,
                m.content_type,
                m.difficulty_level
            FROM user_progress up
            JOIN modules m ON up.module_id = m.id
            WHERE up.user_id = ? AND up.module_id = ?
        `, [userId, moduleId]);

        if (progress.length === 0) {
            // Si no existe progreso, crear uno nuevo
            const newProgress = {
                user_id: userId,
                module_id: moduleId,
                completion_percentage: 0,
                time_spent: 0,
                is_completed: false,
                score: 0
            };

            const result = await insert('user_progress', newProgress);
            
            const createdProgress = await query(`
                SELECT 
                    up.*,
                    m.title as module_title,
                    m.content_type,
                    m.difficulty_level
                FROM user_progress up
                JOIN modules m ON up.module_id = m.id
                WHERE up.id = ?
            `, [result.insertId]);

            return res.json(createdProgress[0]);
        }

        res.json(progress[0]);
    } catch (error) {
        console.error('Error obteniendo progreso del módulo:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Actualizar progreso de un módulo
router.put('/:moduleId', authenticateToken, requireRegisteredUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { moduleId } = req.params;
        const { completion_percentage, time_spent, score } = req.body;

        // Validaciones
        if (completion_percentage !== undefined && (completion_percentage < 0 || completion_percentage > 100)) {
            return res.status(400).json({
                error: 'El porcentaje de completado debe estar entre 0 y 100'
            });
        }

        if (time_spent !== undefined && time_spent < 0) {
            return res.status(400).json({
                error: 'El tiempo gastado no puede ser negativo'
            });
        }

        if (score !== undefined && score < 0) {
            return res.status(400).json({
                error: 'La puntuación no puede ser negativa'
            });
        }

        // Verificar que el módulo existe
        const module = await findById('modules', moduleId);
        if (!module) {
            return res.status(404).json({
                error: 'Módulo no encontrado'
            });
        }

        // Verificar si existe progreso
        const existingProgress = await query(`
            SELECT id FROM user_progress 
            WHERE user_id = ? AND module_id = ?
        `, [userId, moduleId]);

        let progressData = {
            completion_percentage: completion_percentage || 0,
            time_spent: time_spent || 0,
            score: score || 0,
            is_completed: completion_percentage >= 100,
            last_accessed: new Date()
        };

        let result;
        if (existingProgress.length === 0) {
            // Crear nuevo progreso
            progressData.user_id = userId;
            progressData.module_id = moduleId;
            result = await insert('user_progress', progressData);
        } else {
            // Actualizar progreso existente
            result = await update('user_progress', existingProgress[0].id, progressData);
        }

        // Obtener el progreso actualizado
        const updatedProgress = await query(`
            SELECT 
                up.*,
                m.title as module_title,
                m.content_type,
                m.difficulty_level
            FROM user_progress up
            JOIN modules m ON up.module_id = m.id
            WHERE up.user_id = ? AND up.module_id = ?
        `, [userId, moduleId]);

        res.json({
            message: 'Progreso actualizado correctamente',
            progress: updatedProgress[0]
        });

    } catch (error) {
        console.error('Error actualizando progreso:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Marcar módulo como completado
router.post('/:moduleId/complete', authenticateToken, requireRegisteredUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { moduleId } = req.params;
        const { score } = req.body;

        // Verificar que el módulo existe
        const module = await findById('modules', moduleId);
        if (!module) {
            return res.status(404).json({
                error: 'Módulo no encontrado'
            });
        }

        // Verificar si existe progreso
        const existingProgress = await query(`
            SELECT id FROM user_progress 
            WHERE user_id = ? AND module_id = ?
        `, [userId, moduleId]);

        let progressData = {
            completion_percentage: 100,
            is_completed: true,
            score: score || 0,
            last_accessed: new Date()
        };

        if (existingProgress.length === 0) {
            // Crear nuevo progreso completado
            progressData.user_id = userId;
            progressData.module_id = moduleId;
            progressData.time_spent = 0;
            await insert('user_progress', progressData);
        } else {
            // Actualizar progreso existente
            await update('user_progress', existingProgress[0].id, progressData);
        }

        // Obtener el progreso actualizado
        const completedProgress = await query(`
            SELECT 
                up.*,
                m.title as module_title,
                m.content_type,
                m.difficulty_level
            FROM user_progress up
            JOIN modules m ON up.module_id = m.id
            WHERE up.user_id = ? AND up.module_id = ?
        `, [userId, moduleId]);

        res.json({
            message: 'Módulo completado correctamente',
            progress: completedProgress[0]
        });

    } catch (error) {
        console.error('Error completando módulo:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas generales del usuario
router.get('/stats/summary', authenticateToken, requireRegisteredUser, async (req, res) => {
    try {
        const userId = req.user.userId;

        const stats = await query(`
            SELECT 
                COUNT(*) as total_modules_started,
                COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_modules,
                ROUND(AVG(completion_percentage), 2) as average_completion,
                SUM(time_spent) as total_time_spent,
                SUM(score) as total_score,
                MAX(score) as best_score,
                MIN(last_accessed) as first_access,
                MAX(last_accessed) as last_access
            FROM user_progress 
            WHERE user_id = ?
        `, [userId]);

        const totalModules = await query(`
            SELECT COUNT(*) as total_available 
            FROM modules 
            WHERE is_active = true
        `);

        const result = {
            ...stats[0],
            total_available_modules: totalModules[0].total_available,
            completion_rate: totalModules[0].total_available > 0 
                ? Math.round((stats[0].completed_modules / totalModules[0].total_available) * 100) 
                : 0
        };

        res.json(result);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

export default router;