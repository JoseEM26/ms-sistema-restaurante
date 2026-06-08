-- =====================================================
--  SEED: Pedidos de prueba
--  Usa lastval() para referenciar el ID recién insertado
-- =====================================================

-- Pedido 1: Mesa 3, cerrado
INSERT INTO pedidos (mesa_id, cliente_id, estado, total, observaciones, created_at)
VALUES (3, 1, 'CERRADO', 89.00, 'Sin picante en el ceviche', NOW() - INTERVAL '2 hours');

INSERT INTO detalles_pedido (pedido_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
SELECT lastval(), 1,  'Ceviche Clásico', 2, 32.00, 64.00 UNION ALL
SELECT lastval(), 25, 'Inca Kola',       2,  8.00, 16.00 UNION ALL
SELECT lastval(), 31, 'Arroz con Leche', 1,  9.00,  9.00;

-- Pedido 2: Mesa 5, abierto
INSERT INTO pedidos (mesa_id, cliente_id, estado, total, observaciones, created_at)
VALUES (5, 2, 'ABIERTO', 112.00, null, NOW() - INTERVAL '30 minutes');

INSERT INTO detalles_pedido (pedido_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
SELECT lastval(), 9,  'Lomo Saltado',   2, 42.00, 84.00 UNION ALL
SELECT lastval(), 26, 'Chicha Morada',  2,  7.00, 14.00 UNION ALL
SELECT lastval(), 32, 'Suspiro Limeño', 1, 14.00, 14.00;

-- Pedido 3: Mesa 7, en proceso
INSERT INTO pedidos (mesa_id, cliente_id, estado, total, observaciones, created_at)
VALUES (7, 3, 'EN_PROCESO', 156.00, 'Alergia a mariscos en mesa', NOW() - INTERVAL '45 minutes');

INSERT INTO detalles_pedido (pedido_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
SELECT lastval(), 13, 'Pollo a la Brasa', 2, 48.00, 96.00 UNION ALL
SELECT lastval(), 27, 'Limonada Frozen',  3, 10.00, 30.00 UNION ALL
SELECT lastval(), 31, 'Arroz con Leche',  2, 15.00, 30.00;

-- Pedido 4: Mesa 2, cerrado
INSERT INTO pedidos (mesa_id, cliente_id, estado, total, observaciones, created_at)
VALUES (2, 4, 'CERRADO', 44.00, null, NOW() - INTERVAL '3 hours');

INSERT INTO detalles_pedido (pedido_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
SELECT lastval(), 5,  'Papa a la Huancaína', 1, 14.00, 14.00 UNION ALL
SELECT lastval(), 10, 'Ají de Gallina',      1, 35.00, 35.00;

-- Pedido 5: Mesa 10, abierto (grupo grande)
INSERT INTO pedidos (mesa_id, cliente_id, estado, total, observaciones, created_at)
VALUES (10, 5, 'ABIERTO', 278.00, 'Cumpleaños - torta sorpresa', NOW() - INTERVAL '15 minutes');

INSERT INTO detalles_pedido (pedido_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
SELECT lastval(), 1,  'Ceviche Clásico',    2, 32.00,  64.00 UNION ALL
SELECT lastval(), 9,  'Lomo Saltado',       3, 42.00, 126.00 UNION ALL
SELECT lastval(), 25, 'Inca Kola',          4,  8.00,  32.00 UNION ALL
SELECT lastval(), 27, 'Limonada Frozen',    2, 10.00,  20.00 UNION ALL
SELECT lastval(), 33, 'Torta de Chocolate', 1, 16.00,  16.00 UNION ALL
SELECT lastval(), 31, 'Arroz con Leche',    2, 10.00,  20.00;
