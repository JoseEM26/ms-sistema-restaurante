-- =====================================================
--  SEED: Usuarios de prueba
--  Se ejecuta automáticamente con Flyway al crear la BD
-- =====================================================

-- BCrypt de "admin123"
INSERT INTO usuarios (username, password, email, rol) VALUES
('admin',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@restaurant.pe',   'ADMIN')
ON CONFLICT (username) DO NOTHING;

-- BCrypt de "cajero123"
INSERT INTO usuarios (username, password, email, rol) VALUES
('cajero',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cajero@restaurant.pe',  'CAJERO')
ON CONFLICT (username) DO NOTHING;

-- BCrypt de "mesero123"
INSERT INTO usuarios (username, password, email, rol) VALUES
('mesero',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mesero@restaurant.pe',  'MESERO')
ON CONFLICT (username) DO NOTHING;

-- BCrypt de "cocinero123"
INSERT INTO usuarios (username, password, email, rol) VALUES
('cocinero','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cocinero@restaurant.pe','COCINERO')
ON CONFLICT (username) DO NOTHING;
