package com.restaurant.ventas.service;

import com.restaurant.common.exception.BusinessException;
import com.restaurant.common.exception.ResourceNotFoundException;
import com.restaurant.ventas.client.MaestrosClient;
import com.restaurant.ventas.client.dto.ProductoClientResponse;
import com.restaurant.ventas.config.RabbitMQConfig;
import com.restaurant.ventas.dto.request.DetallePedidoRequest;
import com.restaurant.ventas.dto.request.PedidoRequest;
import com.restaurant.ventas.dto.response.PedidoResponse;
import com.restaurant.ventas.entity.DetallePedido;
import com.restaurant.ventas.entity.Pedido;
import com.restaurant.ventas.enums.EstadoPedido;
import com.restaurant.ventas.event.PedidoEvent;
import com.restaurant.ventas.mapper.PedidoMapper;
import com.restaurant.ventas.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final PedidoMapper pedidoMapper;
    private final MaestrosClient maestrosClient;
    private final RabbitTemplate rabbitTemplate;

    @Transactional(readOnly = true)
    public List<PedidoResponse> listarTodos() {
        return pedidoRepository.findAll().stream()
                .map(pedidoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> listarAbiertos() {
        return pedidoRepository.findByEstado(EstadoPedido.ABIERTO).stream()
                .map(pedidoMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PedidoResponse buscarPorId(Long id) {
        return pedidoMapper.toResponse(findById(id));
    }

    @Transactional
    public PedidoResponse crear(PedidoRequest request) {
        // Verificar que la mesa existe y está libre via Feign
        var mesaResponse = maestrosClient.obtenerMesa(request.getMesaId());
        if (!mesaResponse.isSuccess()) {
            throw new BusinessException("Mesa no encontrada o servicio no disponible");
        }
        if (!"LIBRE".equals(mesaResponse.getData().getEstado())) {
            throw new BusinessException("La mesa " + mesaResponse.getData().getNumero() + " no está disponible");
        }

        Pedido pedido = Pedido.builder()
                .mesaId(request.getMesaId())
                .clienteId(request.getClienteId())
                .observaciones(request.getObservaciones())
                .build();

        // Construir detalles consultando precios actuales via Feign
        for (DetallePedidoRequest detalleReq : request.getDetalles()) {
            var productoResponse = maestrosClient.obtenerProducto(detalleReq.getProductoId());
            if (!productoResponse.isSuccess()) {
                throw new BusinessException("Producto " + detalleReq.getProductoId() + " no encontrado");
            }
            ProductoClientResponse producto = productoResponse.getData();
            if (!producto.getDisponible()) {
                throw new BusinessException("El producto '" + producto.getNombre() + "' no está disponible");
            }

            DetallePedido detalle = DetallePedido.builder()
                    .productoId(producto.getId())
                    .productoNombre(producto.getNombre())
                    .cantidad(detalleReq.getCantidad())
                    .precioUnitario(producto.getPrecio())
                    .notas(detalleReq.getNotas())
                    .pedido(pedido)
                    .build();
            detalle.calcularSubtotal();
            pedido.getDetalles().add(detalle);
        }

        pedido.recalcularTotal();
        Pedido saved = pedidoRepository.save(pedido);

        // Marcar mesa como ocupada via Feign
        maestrosClient.cambiarEstadoMesa(request.getMesaId(), "OCUPADA");

        // Publicar evento en RabbitMQ
        publicarEvento(saved, RabbitMQConfig.ROUTING_PEDIDO_NUEVO);

        return pedidoMapper.toResponse(saved);
    }

    @Transactional
    public PedidoResponse cambiarEstado(Long id, EstadoPedido nuevoEstado) {
        Pedido pedido = findById(id);
        pedido.setEstado(nuevoEstado);

        // Si se cierra o cancela, liberar la mesa
        if (nuevoEstado == EstadoPedido.CERRADO || nuevoEstado == EstadoPedido.CANCELADO) {
            maestrosClient.cambiarEstadoMesa(pedido.getMesaId(), "LIBRE");
        }

        Pedido saved = pedidoRepository.save(pedido);
        publicarEvento(saved, RabbitMQConfig.ROUTING_PEDIDO_ACTUALIZADO);

        return pedidoMapper.toResponse(saved);
    }

    private void publicarEvento(Pedido pedido, String routingKey) {
        try {
            PedidoEvent evento = PedidoEvent.builder()
                    .pedidoId(pedido.getId())
                    .mesaId(pedido.getMesaId())
                    .estado(pedido.getEstado().name())
                    .total(pedido.getTotal())
                    .observaciones(pedido.getObservaciones())
                    .fechaEvento(LocalDateTime.now())
                    .build();

            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_PEDIDOS, routingKey, evento);
            log.info("Evento publicado - routing: {} pedidoId: {}", routingKey, pedido.getId());
        } catch (Exception e) {
            log.warn("No se pudo publicar evento RabbitMQ (pedidoId={}, routing={}): {}",
                    pedido.getId(), routingKey, e.getMessage());
        }
    }

    private Pedido findById(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", id));
    }
}
