-- Crear base de datos
CREATE DATABASE IF NOT EXISTS maxwavex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE maxwavex;

-- Tabla de usuarios ya
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL
);

-- Tabla de sesiones de invitados ya
CREATE TABLE guest_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabla de módulos educativos ya
CREATE TABLE modules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content_type ENUM('theory', 'equations', 'applications', 'simulation', 'game') NOT NULL,
    difficulty_level ENUM('basic', 'intermediate', 'advanced') DEFAULT 'basic',
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de progreso del usuario ya
CREATE TABLE user_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    module_id INT NOT NULL,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_spent INT DEFAULT 0, -- en segundos
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE,
    score INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_module (user_id, module_id)
);

-- Tabla de resultados de juegos/simulaciones
CREATE TABLE game_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    guest_session_id INT,
    game_type VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    level_reached INT DEFAULT 1,
    time_played INT NOT NULL, -- en segundos
    metadata JSON, -- datos adicionales del juego
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id) ON DELETE CASCADE
);

-- Tabla de configuraciones del sistema
CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar módulos básicos
INSERT INTO modules (title, description, content_type, difficulty_level, order_index) VALUES
('Ondas Electromagnéticas', 'Introducción a las ondas electromagnéticas y su propagación', 'theory', 'basic', 1),
('Campo Eléctrico', 'Fundamentos del campo eléctrico y sus propiedades', 'theory', 'basic', 2),
('Campo Magnético', 'Bases del campo magnético y su relación con la electricidad', 'theory', 'basic', 3),
('Ley de Gauss', 'Primera ecuación de Maxwell: Ley de Gauss para el campo eléctrico', 'equations', 'intermediate', 4),
('Ley de Gauss Magnética', 'Segunda ecuación de Maxwell: No existen monopolos magnéticos', 'equations', 'intermediate', 5),
('Ley de Faraday', 'Tercera ecuación de Maxwell: Inducción electromagnética', 'equations', 'intermediate', 6),
('Ley de Ampère-Maxwell', 'Cuarta ecuación de Maxwell: Generación de campos magnéticos', 'equations', 'intermediate', 7),
('Simulación de Campos', 'Simulación interactiva de campos electromagnéticos', 'simulation', 'advanced', 8),
('Juego de Ondas', 'Juego interactivo sobre propagación de ondas', 'game', 'basic', 9),
('Aplicaciones Tecnológicas', 'Aplicaciones del electromagnetismo en la tecnología', 'applications', 'advanced', 10);

-- Insertar configuraciones del sistema
INSERT INTO system_config (config_key, config_value, description) VALUES
('app_version', '1.0.0', 'Versión actual de la aplicación'),
('maintenance_mode', 'false', 'Modo de mantenimiento activado/desactivado'),
('guest_session_duration', '3600', 'Duración de sesiones de invitado en segundos'),
('max_score_per_game', '1000', 'Puntuación máxima por juego');

-- Crear índices para mejor rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_module ON user_progress(module_id);
CREATE INDEX idx_game_results_user ON game_results(user_id);
CREATE INDEX idx_game_results_guest ON game_results(guest_session_id);
CREATE INDEX idx_modules_type ON modules(content_type);
CREATE INDEX idx_modules_active ON modules(is_active);