# 📊 Observabilidad — Prometheus + Grafana + Actuator

## ¿Qué es observabilidad?

Observabilidad es la capacidad de entender qué está pasando dentro del sistema sin tener que añadir código nuevo. Se divide en tres pilares:

| Pilar | Herramienta | ¿Para qué? |
|---|---|---|
| **Métricas** | Micrometer + Prometheus | Números que cambian con el tiempo (req/s, latencia, memoria) |
| **Dashboards** | Grafana | Visualizar métricas en tiempo real |
| **Health checks** | Spring Actuator | ¿El servicio está vivo? ¿Está sano? |

---

## Spring Actuator — Endpoints de salud

Cada microservicio expone endpoints HTTP para monitoreo:

| Endpoint | URL | ¿Qué muestra? |
|---|---|---|
| Health | `/actuator/health` | Estado general del servicio |
| Info | `/actuator/info` | Información de la aplicación |
| Metrics | `/actuator/metrics` | Lista de métricas disponibles |
| Prometheus | `/actuator/prometheus` | Métricas en formato Prometheus |
| Circuit breakers | `/actuator/circuitbreakers` | Estado de los circuit breakers |

```json
// GET /actuator/health
{
  "status": "UP",
  "components": {
    "db":       { "status": "UP" },
    "rabbit":   { "status": "UP" },
    "diskSpace":{ "status": "UP" }
  }
}
```

---

## Micrometer — Instrumentación automática

Micrometer es la capa de instrumentación. Spring Boot la configura automáticamente para:
- Contar todas las peticiones HTTP (éxito, error, por endpoint)
- Medir tiempos de respuesta
- Monitorear el pool de conexiones a la BD (HikariCP)
- Medir el uso de memoria JVM (heap, non-heap)
- Registrar el estado de los circuit breakers de Resilience4j

```yaml
# Se activa con esta dependencia en pom.xml
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>

# Y esta configuración en application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
```

---

## Prometheus — Recolección de métricas

Prometheus "scrapea" (consulta) los endpoints `/actuator/prometheus` de cada servicio cada 15 segundos y almacena los datos en series temporales.

**Configuración en `prometheus.yml`:**
```yaml
scrape_configs:
  - job_name: 'ms-ventas'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8083']
    scrape_interval: 15s
```

**Queries PromQL útiles:**
```promql
# Peticiones por segundo a ms-ventas
rate(http_server_requests_seconds_count{job="ms-ventas"}[1m])

# Percentil 95 de latencia
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))

# Estado del circuit breaker
resilience4j_circuitbreaker_state{name="ms-core-maestros"}
```

---

## Grafana — Dashboards

Grafana se conecta a Prometheus y visualiza las métricas. El dashboard "Restaurant Backend Overview" incluye:

| Panel | Métrica | Alerta cuando |
|---|---|---|
| HTTP Requests/s | `rate(http_server_requests...)` | > 100 req/s |
| Response Time p95 | `histogram_quantile(0.95, ...)` | > 500ms |
| JVM Heap | `jvm_memory_used_bytes{area="heap"}` | > 85% |
| DB Connections | `hikaricp_connections_active` | > 8 |
| Circuit Breaker | `resilience4j_circuitbreaker_state` | OPEN |

**Acceso:** http://localhost:3001 (admin/admin)

El datasource Prometheus y el dashboard se provisionan automáticamente al iniciar el contenedor gracias a los archivos en `grafana/provisioning/`.
