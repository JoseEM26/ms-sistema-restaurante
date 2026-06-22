-- =====================================================
--  SEED: Pedidos de prueba (idempotente con CTEs)
--  Solo inserta si la tabla está vacía
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pedidos LIMIT 1) THEN

    -- ── Pedido 1: Mesa 3, cerrado ──────────────────────────────────────
    WITH p1 AS (
      INSERT INTO pedidos (mesa_id, estado, total, observaciones, created_at)
      VALUES (3, 'CERRADO', 89.00, 'Sin picante en el ceviche', NOW() - INTERVAL '2 hours')
      RETURNING id
    )
    INSERT INTO detalles_pedido (pedido_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
    SELECT p1.id, 1,  'Ceviche Clásico', 2, 32.00, 64.00 FROM p1 UNION ALL
    SELECT p1.id, 25, 'Inca Kola',       2,  8.00, 16.00 FROM p1 UNION ALL
    SELECT p1.id, 31, 'Arroz con Leche', 1,  9.00,  9.00 FROM p1;

    -- ── Pedido 2: Mesa 5, abierto ─────────────────────────────────────
    WITH p2 AS (
      INSERT INTO pedidos (mesa_id, estado, total, observaciones, created_at)
      VALUES (5, 'ABIERTO', 112.00, null, NOW() - INTERVAL '30 minutes')
      RETURNING id
    )
    INSERT INTO detalles_pedido (pedido_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
    SELECT p2.id, 9,  'Lomo Saltado',   2, 42.00, 84.00 FROM p2 UNION ALL
    SELECT p2.id, 26, 'Chicha Morada',  2,  7.00, 14.00 FROM p2 UNION ALL
    SELECT p2.id, 32, 'Suspiro Limeño', 1, 14.00, 14.00 FROM p2;

    -- ── Pedido 3: Mesa 7, en proceso ──────────────────────────────────
    WITH p3 AS (
      INSERT INTO pedidos (mesa_id, estado, total, observaciones, created_at)
      VALUES (7, 'EN_PROCESO', 156.00, 'Alergia a mariscos en mesa', NOW() - INTERVAL '45 minutes')
      RETURNING id
    )
    INSERT INTO detalles_pedido (pedido_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
    SELECT p3.id, 13, 'Pollo a la Brasa', 2, 48.00,  96.00 FROM p3 UNION ALL
    SELECT p3.id, 27, 'Limonada Frozen',  3, 10.00,  30.00 FROM p3 UNION ALL
    SELECT p3.id, 31, 'Arroz con Leche',  2, 15.00,  30.00 FROM p3;

    -- ── Pedido 4: Mesa 2, cerrado ─────────────────────────────────────
    WITH p4 AS (
      INSERT INTO pedidos (mesa_id, estado, total, observaciones, created_at)
      VALUES (2, 'CERRADO', 44.00, null, NOW() - INTERVAL '3 hours')
      RETURNING id
    )
    INSERT INTO detalles_pedido (pedido_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
    SELECT p4.id, 5,  'Papa a la Huancaína', 1, 14.00, 14.00 FROM p4 UNION ALL
    SELECT p4.id, 10, 'Ají de Gallina',      1, 35.00, 35.00 FROM p4;

    -- ── Pedido 5: Mesa 10, abierto (grupo grande) ─────────────────────
    WITH p5 AS (
      INSERT INTO pedidos (mesa_id, estado, total, observaciones, created_at)
      VALUES (10, 'ABIERTO', 278.00, 'Cumpleaños - torta sorpresa', NOW() - INTERVAL '15 minutes')
      RETURNING id
    )
    INSERT INTO detalles_pedido (pedido_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
    SELECT p5.id, 1,  'Ceviche Clásico',    2, 32.00,  64.00 FROM p5 UNION ALL
    SELECT p5.id, 9,  'Lomo Saltado',       3, 42.00, 126.00 FROM p5 UNION ALL
    SELECT p5.id, 25, 'Inca Kola',          4,  8.00,  32.00 FROM p5 UNION ALL
    SELECT p5.id, 27, 'Limonada Frozen',    2, 10.00,  20.00 FROM p5 UNION ALL
    SELECT p5.id, 33, 'Torta de Chocolate', 1, 16.00,  16.00 FROM p5 UNION ALL
    SELECT p5.id, 31, 'Arroz con Leche',    2, 10.00,  20.00 FROM p5;

  END IF;
END $$;
