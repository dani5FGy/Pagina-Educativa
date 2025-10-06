import express from 'express';
import { query, insert } from '../config/database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Guardar resultado de juego
router.post('/result', authenticateToken, async (req, res) => {
    try {
        const { gameType, score, levelReached, timePlayed, metadata } = req.body;

        // Validaciones
        if (!gameType || score === undefined || !levelReached || !timePlayed) {
            return res.status(400).json({
                error: 'Datos incompletos',
                required: ['gameType', 'score', 'levelReached', 'timePlayed']
            });
        }

        if (score < 0 || levelReached < 1 || timePlayed < 0) {
            return res.status(400).json({
                error: 'Valores inválidos',
                message: 'Score, level y time deben ser valores positivos'
            });
        }

        const gameResult = {
            user_id: req.user.userType === 'guest' ? null : req.user.userId,
            guest_session_id: req.user.userType === 'guest' ? req.user.guestId : null,
            game_type: gameType,
            score: score,
            level_reached: levelReached,
            time_played: timePlayed,
            metadata: metadata ? JSON.stringify(metadata) : null,
            played_at: new Date()
        };

        const result = await insert('game_results', gameResult);

        res.status(201).json({
            message: 'Resultado guardado correctamente',
            resultId: result.insertId,
            score: score,
            levelReached: levelReached
        });

    } catch (error) {
        console.error('Error guardando resultado:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Obtener tabla de líderes (leaderboard)
router.get('/leaderboard/:gameType', async (req, res) => {
    try {
        const { gameType } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);

        const leaderboard = await query(`
            SELECT 
                gr.score,
                gr.level_reached,
                gr.time_played,
                gr.played_at,
                COALESCE(u.name, gs.username, 'Anónimo') as player_name,
                CASE 
                    WHEN u.id IS NOT NULL THEN 'registered'
                    WHEN gs.id IS NOT NULL THEN 'guest'
                    ELSE 'anonymous'
                END as player_type
            FROM game_results gr
            LEFT JOIN users u ON gr.user_id = u.id
            LEFT JOIN guest_sessions gs ON gr.guest_session_id = gs.id
            WHERE gr.game_type = ?
            ORDER BY gr.score DESC, gr.level_reached DESC, gr.time_played ASC
            LIMIT ?
        `, [gameType, limit]);

        // Agregar posición en el ranking
        const leaderboardWithRank = leaderboard.map((entry, index) => ({
            rank: index + 1,
            ...entry
        }));

        res.json({
            gameType,
            totalEntries: leaderboard.length,
            leaderboard: leaderboardWithRank
        });

    } catch (error) {
        console.error('Error obteniendo leaderboard:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas personales del usuario
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        let userCondition, userParam;
        
        if (req.user.userType === 'guest') {
            userCondition = 'guest_session_id = ?';
            userParam = req.user.guestId;
        } else {
            userCondition = 'user_id = ?';
            userParam = req.user.userId;
        }

        const stats = await query(`
            SELECT 
                COUNT(*) as total_games_played,
                COUNT(DISTINCT game_type) as unique_games_played,
                MAX(score) as best_score,
                AVG(score) as average_score,
                MAX(level_reached) as highest_level,
                AVG(level_reached) as average_level,
                SUM(time_played) as total_time_played,
                MIN(played_at) as first_game,
                MAX(played_at) as last_game
            FROM game_results 
            WHERE ${userCondition}
        `, [userParam]);

        // Estadísticas por tipo de juego
        const gameTypeStats = await query(`
            SELECT 
                game_type,
                COUNT(*) as games_played,
                MAX(score) as best_score,
                AVG(score) as average_score,
                MAX(level_reached) as highest_level,
                SUM(time_played) as total_time
            FROM game_results 
            WHERE ${userCondition}
            GROUP BY game_type
            ORDER BY best_score DESC
        `, [userParam]);

        // Progreso reciente (últimos 10 juegos)
        const recentGames = await query(`
            SELECT 
                game_type,
                score,
                level_reached,
                time_played,
                played_at
            FROM game_results 
            WHERE ${userCondition}
            ORDER BY played_at DESC
            LIMIT 10
        `, [userParam]);

        const result = {
            general: stats[0],
            byGameType: gameTypeStats,
            recentGames: recentGames
        };

        res.json(result);

    } catch (error) {
        console.error('Error obteniendo estadísticas del usuario:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Obtener mejores puntuaciones por juego
router.get('/personal-best/:gameType', authenticateToken, async (req, res) => {
    try {
        const { gameType } = req.params;
        let userCondition, userParam;
        
        if (req.user.userType === 'guest') {
            userCondition = 'guest_session_id = ?';
            userParam = req.user.guestId;
        } else {
            userCondition = 'user_id = ?';
            userParam = req.user.userId;
        }

        const personalBest = await query(`
            SELECT 
                MAX(score) as best_score,
                MAX(level_reached) as highest_level,
                MIN(time_played) as fastest_time,
                COUNT(*) as times_played,
                AVG(score) as average_score,
                MAX(played_at) as last_played
            FROM game_results 
            WHERE ${userCondition} AND game_type = ?
        `, [userParam, gameType]);

        // Obtener el mejor resultado completo
        const bestGameDetails = await query(`
            SELECT score, level_reached, time_played, played_at, metadata
            FROM game_results 
            WHERE ${userCondition} AND game_type = ?
            ORDER BY score DESC, level_reached DESC, time_played ASC
            LIMIT 1
        `, [userParam, gameType]);

        const result = {
            gameType,
            summary: personalBest[0],
            bestGame: bestGameDetails[0] || null
        };

        res.json(result);

    } catch (error) {
        console.error('Error obteniendo mejor puntuación personal:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas globales del sistema
router.get('/system-stats', async (req, res) => {
    try {
        const globalStats = await query(`
            SELECT 
                COUNT(*) as total_games_played,
                COUNT(DISTINCT COALESCE(user_id, guest_session_id)) as unique_players,
                COUNT(DISTINCT game_type) as available_games,
                MAX(score) as highest_score_ever,
                AVG(score) as global_average_score,
                MAX(level_reached) as highest_level_ever,
                SUM(time_played) as total_playtime_seconds
            FROM game_results
        `);

        // Top juegos más jugados
        const popularGames = await query(`
            SELECT 
                game_type,
                COUNT(*) as times_played,
                COUNT(DISTINCT COALESCE(user_id, guest_session_id)) as unique_players,
                MAX(score) as highest_score,
                AVG(score) as average_score
            FROM game_results
            GROUP BY game_type
            ORDER BY times_played DESC
            LIMIT 5
        `);

        // Actividad reciente
        const recentActivity = await query(`
            SELECT 
                DATE(played_at) as game_date,
                COUNT(*) as games_played,
                COUNT(DISTINCT COALESCE(user_id, guest_session_id)) as active_players
            FROM game_results
            WHERE played_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(played_at)
            ORDER BY game_date DESC
        `);

        const result = {
            global: globalStats[0],
            popularGames,
            weeklyActivity: recentActivity
        };

        res.json(result);

    } catch (error) {
        console.error('Error obteniendo estadísticas del sistema:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
});

export default router;