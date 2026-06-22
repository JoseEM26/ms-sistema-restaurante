package com.restaurant.notificaciones.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_PEDIDOS          = "exchange.pedidos";
    public static final String QUEUE_PEDIDO_NUEVO        = "queue.pedido.nuevo";
    public static final String QUEUE_PEDIDO_ACTUALIZADO  = "queue.pedido.actualizado";
    public static final String ROUTING_PEDIDO_NUEVO      = "pedido.nuevo";
    public static final String ROUTING_PEDIDO_ACTUALIZADO = "pedido.actualizado";

    // Declara exchange y queues para que existan independientemente del orden de arranque
    @Bean
    public TopicExchange exchangePedidos() {
        return new TopicExchange(EXCHANGE_PEDIDOS);
    }

    @Bean
    public Queue queuePedidoNuevo() {
        return QueueBuilder.durable(QUEUE_PEDIDO_NUEVO).build();
    }

    @Bean
    public Queue queuePedidoActualizado() {
        return QueueBuilder.durable(QUEUE_PEDIDO_ACTUALIZADO).build();
    }

    @Bean
    public Binding bindingPedidoNuevo(Queue queuePedidoNuevo, TopicExchange exchangePedidos) {
        return BindingBuilder.bind(queuePedidoNuevo).to(exchangePedidos).with(ROUTING_PEDIDO_NUEVO);
    }

    @Bean
    public Binding bindingPedidoActualizado(Queue queuePedidoActualizado, TopicExchange exchangePedidos) {
        return BindingBuilder.bind(queuePedidoActualizado).to(exchangePedidos).with(ROUTING_PEDIDO_ACTUALIZADO);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
