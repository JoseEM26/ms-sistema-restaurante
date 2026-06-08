# 📨 Mensajería — RabbitMQ y eventos asíncronos

## ¿Por qué necesitamos mensajería asíncrona?

**Escenario sin mensajería:**
```
Mesero crea pedido → ms-ventas → notifica cocina (HTTP síncrono)
                              → envía email (HTTP síncrono)
                              → actualiza pantalla (HTTP síncrono)
```
Si alguna de esas operaciones falla o tarda, el mesero espera. Si el servicio de email está caído, el pedido no se puede crear.

**Con RabbitMQ:**
```
Mesero crea pedido → ms-ventas → guarda en BD → responde al mesero (rápido)
                              → publica evento en RabbitMQ (no espera)
                              
                    (en paralelo, sin bloquear)
                    ms-notificaciones ← consume evento ← notifica cocina
```

---

## Conceptos de RabbitMQ

```
PRODUCER (ms-ventas)
    │ publica mensaje
    ▼
EXCHANGE (exchange.pedidos)  ← Decide a qué cola va el mensaje
    │ routing key: "pedido.nuevo"
    ├──────────────────────▶ QUEUE: queue.pedido.nuevo
    │ routing key: "pedido.actualizado"
    └──────────────────────▶ QUEUE: queue.pedido.actualizado
                                        │
                                CONSUMER (ms-notificaciones)
                                    │ procesa el mensaje
                                    ▼
                              log / email / push notification
```

| Componente | ¿Qué es? |
|---|---|
| **Producer** | El que envía el mensaje (ms-ventas) |
| **Exchange** | El "cartero" que decide a qué cola va el mensaje |
| **Routing Key** | La "dirección" del mensaje |
| **Queue** | El buzón donde esperan los mensajes |
| **Consumer** | El que lee y procesa los mensajes (ms-notificaciones) |

---

## Configuración en el código

### ms-ventas (Producer)

```java
// RabbitMQConfig.java — define la topología
@Bean
public TopicExchange exchangePedidos() {
    return new TopicExchange("exchange.pedidos");
}

@Bean
public Queue queuePedidoNuevo() {
    return QueueBuilder.durable("queue.pedido.nuevo").build();
}

@Bean
public Binding bindingPedidoNuevo(Queue q, TopicExchange e) {
    return BindingBuilder.bind(q).to(e).with("pedido.nuevo");
}

// PedidoService.java — publica el evento
private void publicarEvento(Pedido pedido, String routingKey) {
    PedidoEvent evento = PedidoEvent.builder()
        .pedidoId(pedido.getId())
        .mesaId(pedido.getMesaId())
        .estado(pedido.getEstado().name())
        .total(pedido.getTotal())
        .fechaEvento(LocalDateTime.now())
        .build();
    
    rabbitTemplate.convertAndSend("exchange.pedidos", routingKey, evento);
}
```

### ms-notificaciones (Consumer)

```java
@RabbitListener(queues = "queue.pedido.nuevo")
public void recibirPedidoNuevo(Map<String, Object> evento) {
    // Se ejecuta automáticamente cuando llega un mensaje
    log.info("Nuevo pedido #{} - Mesa #{} - Total: S/. {}",
        evento.get("pedidoId"), evento.get("mesaId"), evento.get("total"));
    
    // Aquí iría: notificar pantalla de cocina, enviar email, etc.
}
```

---

## Ventajas del uso de RabbitMQ aquí

| Situación | Sin RabbitMQ | Con RabbitMQ |
|---|---|---|
| ms-notificaciones caído | Pedido falla | Pedido se crea, mensaje queda en cola |
| Pico de pedidos | Notificaciones se acumulan y colapsan | La cola amortigua el pico |
| Agregar notificación nueva | Modificar ms-ventas | Solo agregar un nuevo consumer |
| Auditoría | No hay registro | Mensajes en cola = log de eventos |

## Serialización de mensajes

Los mensajes se serializan como JSON automáticamente:

```java
// Configurado en RabbitMQConfig
@Bean
public Jackson2JsonMessageConverter messageConverter() {
    return new Jackson2JsonMessageConverter();
}
```

Esto permite que el consumer reciba el mensaje como `Map<String, Object>` sin necesitar la clase `PedidoEvent` del servicio productor.
