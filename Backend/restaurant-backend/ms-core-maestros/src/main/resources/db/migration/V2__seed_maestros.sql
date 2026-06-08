-- =====================================================
--  SEED: Catálogos del restaurante
--  Usa subconsultas para evitar dependencia de IDs
-- =====================================================

-- ── Categorías adicionales ──────────────────────────
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Sopas y Cremas',      'Sopas, cremas y caldos'),
  ('Carnes y Parrillas',  'Cortes de carne y parrilladas'),
  ('Mariscos y Pescados', 'Platos del mar frescos'),
  ('Pasta y Arroces',     'Pastas, arroces y cereales'),
  ('Bebidas Calientes',   'Café, té e infusiones'),
  ('Menú del Día',        'Menú económico diario')
ON CONFLICT (nombre) DO NOTHING;

-- ── Productos por categoría (subconsulta por nombre) ─

-- Entradas
INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Ceviche Clásico','Pescado fresco marinado en limón con cebolla y ají',32.00,true,id FROM categorias WHERE nombre='Entradas'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Causa Rellena','Causa de papa amarilla con atún o pollo',18.00,true,id FROM categorias WHERE nombre='Entradas'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Tequeños de Queso','6 unidades con salsa criolla',16.00,true,id FROM categorias WHERE nombre='Entradas'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Anticuchos','Brochetas de corazón de res al carbón',22.00,true,id FROM categorias WHERE nombre='Entradas'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Papa a la Huancaína','Papa sancochada con salsa huancaína y huevo',14.00,true,id FROM categorias WHERE nombre='Entradas'
ON CONFLICT DO NOTHING;

-- Sopas
INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Sopa Criolla','Sopa de fideos con carne y leche evaporada',22.00,true,id FROM categorias WHERE nombre='Sopas y Cremas'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Chupe de Camarones','Chupe cremoso con camarones del río',52.00,true,id FROM categorias WHERE nombre='Sopas y Cremas'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Crema de Zapallo','Crema de zapallo macre con queso parmesano',18.00,true,id FROM categorias WHERE nombre='Sopas y Cremas'
ON CONFLICT DO NOTHING;

-- Platos Principales
INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Lomo Saltado','Lomo de res salteado con papa frita y arroz',42.00,true,id FROM categorias WHERE nombre='Platos Principales'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Ají de Gallina','Pollo desmenuzado en salsa de ají amarillo',35.00,true,id FROM categorias WHERE nombre='Platos Principales'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Arroz con Pollo','Arroz verde con pollo y salsa criolla',30.00,true,id FROM categorias WHERE nombre='Platos Principales'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Seco de Cabrito','Cabrito guisado con chicha de jora y frejoles',45.00,true,id FROM categorias WHERE nombre='Platos Principales'
ON CONFLICT DO NOTHING;

-- Carnes
INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Pollo a la Brasa','Pollo entero a la brasa con papas y ensalada',48.00,true,id FROM categorias WHERE nombre='Carnes y Parrillas'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Churrasco de Res','Churrasco 250g con papas al hilo y chimichurri',58.00,true,id FROM categorias WHERE nombre='Carnes y Parrillas'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Costillas BBQ','Costillas de cerdo con salsa BBQ casera',55.00,true,id FROM categorias WHERE nombre='Carnes y Parrillas'
ON CONFLICT DO NOTHING;

-- Mariscos
INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Arroz con Mariscos','Arroz cremoso con mix de mariscos frescos',48.00,true,id FROM categorias WHERE nombre='Mariscos y Pescados'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Sudado de Pescado','Pescado del día sudado con tomate y ají',38.00,true,id FROM categorias WHERE nombre='Mariscos y Pescados'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Jalea Mixta','Mix de mariscos fritos con taralillo y salsa criolla',45.00,true,id FROM categorias WHERE nombre='Mariscos y Pescados'
ON CONFLICT DO NOTHING;

-- Pasta y Arroces
INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Spaghetti Bolognesa','Pasta con salsa boloñesa de res',28.00,true,id FROM categorias WHERE nombre='Pasta y Arroces'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Risotto de Setas','Risotto cremoso con setas y parmesano',32.00,true,id FROM categorias WHERE nombre='Pasta y Arroces'
ON CONFLICT DO NOTHING;

-- Bebidas (ya existe la categoría de V1)
INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Inca Kola','Gaseosa 500ml',8.00,true,id FROM categorias WHERE nombre='Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Chicha Morada','Chicha morada casera 500ml',7.00,true,id FROM categorias WHERE nombre='Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Limonada Frozen','Limonada frozen con menta',10.00,true,id FROM categorias WHERE nombre='Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Maracuyá Natural','Jugo de maracuyá natural',9.00,true,id FROM categorias WHERE nombre='Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Agua Mineral','Agua mineral 625ml',5.00,true,id FROM categorias WHERE nombre='Bebidas'
ON CONFLICT DO NOTHING;

-- Bebidas calientes
INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Café Americano','Café americano 250ml',8.00,true,id FROM categorias WHERE nombre='Bebidas Calientes'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Cappuccino','Cappuccino con leche vaporizada',10.00,true,id FROM categorias WHERE nombre='Bebidas Calientes'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Té de Hierbas','Té de manzanilla, menta o anís',6.00,true,id FROM categorias WHERE nombre='Bebidas Calientes'
ON CONFLICT DO NOTHING;

-- Postres (ya existe la categoría de V1)
INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Arroz con Leche','Arroz con leche con canela y coco',12.00,true,id FROM categorias WHERE nombre='Postres'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Suspiro Limeño','Manjar blanco con merengue de oporto',14.00,true,id FROM categorias WHERE nombre='Postres'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Torta de Chocolate','Porción de torta húmeda de chocolate',16.00,true,id FROM categorias WHERE nombre='Postres'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Mazamorra Morada','Mazamorra morada con frutas secas',12.00,true,id FROM categorias WHERE nombre='Postres'
ON CONFLICT DO NOTHING;

-- Menú del Día
INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Menú Ejecutivo','Entrada + fondo + refresco del día',22.00,true,id FROM categorias WHERE nombre='Menú del Día'
ON CONFLICT DO NOTHING;

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id)
SELECT 'Menú Completo','Sopa + fondo + postre + refresco',28.00,true,id FROM categorias WHERE nombre='Menú del Día'
ON CONFLICT DO NOTHING;

-- ── Mesas adicionales (V1 ya creó las 5 primeras) ──
INSERT INTO mesas (numero, capacidad, estado) VALUES
  (6,  4,  'LIBRE'),
  (7,  6,  'LIBRE'),
  (8,  6,  'LIBRE'),
  (9,  6,  'LIBRE'),
  (10, 8,  'LIBRE'),
  (11, 8,  'LIBRE'),
  (12, 10, 'LIBRE')
ON CONFLICT (numero) DO NOTHING;

-- ── Clientes ────────────────────────────────────────
INSERT INTO clientes (nombre, apellido, telefono, email) VALUES
  ('Carlos',   'Quispe',   '987654321', 'carlos.quispe@restaurant.pe'),
  ('María',    'López',    '976543210', 'maria.lopez@restaurant.pe'),
  ('Jorge',    'Ramírez',  '965432109', 'jorge.ramirez@restaurant.pe'),
  ('Ana',      'Torres',   '954321098', 'ana.torres@restaurant.pe'),
  ('Luis',     'García',   '943210987', 'luis.garcia@restaurant.pe'),
  ('Rosa',     'Mendoza',  '932109876', 'rosa.mendoza@restaurant.pe'),
  ('Roberto',  'Flores',   '921098765', 'roberto.flores@restaurant.pe'),
  ('Patricia', 'Vásquez',  '910987654', 'patricia.vasquez@restaurant.pe')
ON CONFLICT (email) DO NOTHING;
