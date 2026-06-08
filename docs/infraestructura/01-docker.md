# 🐳 Docker — Infraestructura de servicios

## ¿Qué se dockeriza y qué no?

| Servicio | Docker | Local |
|---|---|---|
| RabbitMQ | ✅ Contenedor | — |
| Redis | ✅ Contenedor | — |
| Prometheus | ✅ Contenedor | — |
| Grafana | ✅ Contenedor | — |
| SonarQube | ✅ Contenedor | — |
| PostgreSQL | — | ✅ Local |
| Microservicios Java | — | ✅ Local (IDE / BAT) |
| Frontend Angular | — | ✅ Local |

**¿Por qué la BD local?** Para mayor velocidad en desarrollo. PostgreSQL local es más rápido que uno en Docker durante el desarrollo activo.

---

## Servicios Docker

### RabbitMQ `:5672` (AMQP) / `:15672` (Management UI)

**¿Para qué?** Broker de mensajes. Recibe eventos de `ms-ventas` y los entrega a `ms-notificaciones`.

**Acceso:** http://localhost:15672 → usuario: `guest` / contraseña: `guest`

**¿Qué ver en el UI?** Queues activas, mensajes pendientes, tasa de publicación/consumo.

### Redis `:6379`

**¿Para qué?** Cache y rate limiting en el API Gateway. Si un cliente hace demasiadas peticiones, Redis lleva la cuenta y el Gateway las rechaza.

### Prometheus `:9090`

**¿Para qué?** Recoge métricas de los microservicios cada 15 segundos. Los servicios exponen `/actuator/prometheus` con datos como:
- Peticiones HTTP por segundo
- Tiempo de respuesta (percentil 95)
- Memoria JVM usada
- Conexiones a la BD (HikariCP)
- Estado del circuit breaker

**Acceso:** http://localhost:9090 — Puedes ejecutar queries PromQL

### Grafana `:3001`

**¿Para qué?** Visualiza las métricas de Prometheus en dashboards. Ya está configurado con:
- Datasource Prometheus (auto-provisionado)
- Dashboard "Restaurant Backend Overview" (auto-provisionado)

**Acceso:** http://localhost:3001 → usuario: `admin` / contraseña: `admin`

### SonarQube `:9000`

**¿Para qué?** Analiza la calidad del código: bugs potenciales, code smells, duplicaciones, cobertura de tests.

**Acceso:** http://localhost:9000 → usuario: `admin` / contraseña: `admin`

**Para ejecutar el análisis:**
```bash
mvn clean verify sonar:sonar \
  -Dsonar.projectKey=restaurant-backend \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=TU_TOKEN_SONAR
```

---

## Comandos útiles

```bash
# Levantar toda la infraestructura
docker compose up -d

# Ver estado de los contenedores
docker ps

# Ver logs de un contenedor
docker logs restaurant-rabbitmq -f

# Detener todo
docker compose down

# Detener y eliminar volúmenes (CUIDADO: borra datos)
docker compose down -v
```

---

## Orden de arranque de microservicios

```
1. docker compose up -d          ← Primero infraestructura
2. eureka-server   :8761         ← Registro (otros lo necesitan)
3. config-server   :8888         ← Configuración centralizada
4. ms-auth-security :8081        ← Usuarios y tokens
5. ms-core-maestros :8082        ← Catálogos
6. ms-ventas        :8083        ← Pedidos
7. ms-notificaciones :8084       ← Eventos RabbitMQ
8. ms-reportes      :8085        ← PDFs
9. api-gateway      :8080        ← Último (rutea a todos los anteriores)
```

**¿Por qué este orden?** Eureka debe estar listo antes de que los demás se registren. El Gateway debe estar último porque necesita que todos los microservicios ya estén en Eureka.
