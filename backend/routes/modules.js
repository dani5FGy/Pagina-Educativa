import express from 'express';
import { query, findById, findByField } from '../config/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Obtener todos los módulos (público)
router.get('/', async (req, res) => {
    try {
        const modules = await query(`
            SELECT id, title, description, content_type, difficulty_level, order_index, is_active
            FROM modules 
            WHERE is_active = true 
            ORDER BY order_index ASC
        `);

        res.json(modules);
    } catch (error) {
        console.error('Error obteniendo módulos:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Obtener módulo por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const module = await findById('modules', id);
        
        if (!module) {
            return res.status(404).json({
                error: 'Módulo no encontrado'
            });
        }

        if (!module.is_active) {
            return res.status(404).json({
                error: 'Módulo no disponible'
            });
        }

        res.json(module);
    } catch (error) {
        console.error('Error obteniendo módulo:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Obtener módulos por tipo de contenido
router.get('/type/:contentType', async (req, res) => {
    try {
        const { contentType } = req.params;
        
        const validTypes = ['theory', 'equations', 'applications', 'simulation', 'game'];
        if (!validTypes.includes(contentType)) {
            return res.status(400).json({
                error: 'Tipo de contenido inválido'
            });
        }

        const modules = await query(`
            SELECT id, title, description, content_type, difficulty_level, order_index
            FROM modules 
            WHERE content_type = ? AND is_active = true 
            ORDER BY order_index ASC
        `, [contentType]);

        res.json(modules);
    } catch (error) {
        console.error('Error obteniendo módulos por tipo:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas de módulos (requiere autenticación)
router.get('/stats/summary', authenticateToken, async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) as total_modules,
                COUNT(CASE WHEN difficulty_level = 'basic' THEN 1 END) as basic_modules,
                COUNT(CASE WHEN difficulty_level = 'intermediate' THEN 1 END) as intermediate_modules,
                COUNT(CASE WHEN difficulty_level = 'advanced' THEN 1 END) as advanced_modules,
                COUNT(CASE WHEN content_type = 'theory' THEN 1 END) as theory_modules,
                COUNT(CASE WHEN content_type = 'equations' THEN 1 END) as equations_modules,
                COUNT(CASE WHEN content_type = 'applications' THEN 1 END) as applications_modules,
                COUNT(CASE WHEN content_type = 'simulation' THEN 1 END) as simulation_modules,
                COUNT(CASE WHEN content_type = 'game' THEN 1 END) as game_modules
            FROM modules 
            WHERE is_active = true
        `);

        res.json(stats[0]);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

export default router;