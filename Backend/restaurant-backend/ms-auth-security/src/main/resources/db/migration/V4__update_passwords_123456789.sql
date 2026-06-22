-- Unifica contraseñas de todos los usuarios de prueba a: 123456789
UPDATE usuarios
SET password = '$2b$10$XoeK8o2eqNqO.Hwv64EhH.Hwqa8JC7gUWoRRudberbXgEAZaQtCfq'
WHERE username IN ('admin', 'cajero', 'mesero', 'cocinero');
