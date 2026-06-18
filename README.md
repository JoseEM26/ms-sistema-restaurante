# Sistema de Restaurante — Arquitectura de Microservicios

Stack completo con Spring Boot 3, Angular 20 / Ionic, PostgreSQL, RabbitMQ, Redis y observabilidad (Prometheus + Grafana). Todo corre en Docker — no necesitas Java, Node ni Maven instalados.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENTE                         │
│                    http://localhost:4200                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Frontend   │  Angular 20 + Ionic
                    │  nginx:80   │  (proxy /api → gateway)
                    └──────┬──────┘
                           │ /api/*
                    ┌──────▼──────┐
                    │ API Gateway │  Spring Cloud Gateway + JWT
                    │  port 8080  │  + Redis (rate limit)
                    └──────┬──────┘
          ┌────────┬───────┼────────┬────────┐
          │        │       │        │        │
     ┌────▼──┐ ┌───▼───┐ ┌▼─────┐ ┌▼──────┐ ┌▼───────┐
     │ms-auth│ │maestro│ │ventas│ │notif  │ │reportes│
     │ :8081 │ │ :8082 │ │:8083 │ │ :8084 │ │ :8085  │
     └───┬───┘ └───┬───┘ └──┬───┘ └───┬───┘ └────────┘
         │         │        │         │
    ┌────▼─┐  ┌────▼─┐ ┌────▼─┐  ┌───▼────┐
    │db_auth│ │db_mae│ │db_ven│  │RabbitMQ│
    └──────┘  └──────┘ └──────┘  └────────┘
         └─────────────┘
              PostgreSQL :5433

     ┌──────────────┐   ┌───────────────┐
     │ Eureka :8761 │   │ Config :8888  │
     │ Service Disc.│   │ Config Server │
     └──────────────┘   └───────────────┘

     ┌────────────┐   ┌──────────┐   ┌──────────┐
     │Prometheus  │   │ Grafana  │   │SonarQube │
     │  :9090     │   │  :3001   │   │  :9000   │
     └────────────┘   └──────────┘   └──────────┘
```

---

## Requisitos

| Herramienta | Versión mínima | Notar |
|---|---|---|
| **Docker Desktop** | 4.x | Única dependencia real |
| **Docker Compose** | 2.x | Incluido en Docker Desktop |

> Java, Node.js y Maven se ejecutan **dentro** de los contenedores. No los necesitas instalados.

---

## Levantar el stack

### 1. Verificar puertos libres (recomendado)

**Windows:**
```powershell
.\check-ports.ps1
```

**Mac / Linux:**
```bash
chmod +x check-ports.sh
./check-ports.sh
```

El script detecta qué procesos ocupan los puertos y te dice el comando exacto para liberarlos.

> **Nota Windows:** Si tienes PostgreSQL instalado localmente, no hay conflicto — el stack Docker usa el puerto `5433` en el host.

### 2. Construir e iniciar

```bash
docker-compose up --build -d
```

El **primer build** descarga imágenes Maven, Node y demás dependencias (~15-20 min). Los builds siguientes usan caché de Docker y son rápidos.

### 3. Verificar que todo está corriendo

```bash
docker ps
```

Deberías ver 15 contenedores en estado `Up` o `healthy`.

---

## URLs del sistema

| Servicio | URL | Credenciales |
|---|---|---|
| **Frontend** | http://localhost:4200 | ver sección Usuarios |
| **API Gateway / Swagger** | http://localhost:8080/swagger-ui.html | — |
| **Eureka (Service Discovery)** | http://localhost:8761 | — |
| **RabbitMQ Management** | http://localhost:15672 | `guest` / `guest` |
| **Prometheus** | http://localhost:9090 | — |
| **Grafana** | http://localhost:3001 | `admin` / `admin` |
| **SonarQube** | http://localhost:9000 | `admin` / `admin` |
| **PostgreSQL (host)** | `localhost:5433` | `postgres` / `postgres` |

---

## Usuarios del sistema

Todos los usuarios se crean automáticamente con Flyway al levantar el stack.

| Usuario | Contraseña | Rol | Acceso |
|---|---|---|---|
| `admin` | `password` | ADMIN | Acceso total |
| `cajero` | `password` | CAJERO | Caja y ventas |
| `mesero` | `password` | MESERO | Toma de pedidos |
| `cocinero` | `password` | COCINERO | Vista de cocina |

---

## Microservicios

| Servicio | Puerto | Descripción | Base de datos |
|---|---|---|---|
| `eureka-server` | 8761 | Service Discovery | — |
| `config-server` | 8888 | Configuración centralizada | — |
| `api-gateway` | 8080 | Gateway + JWT + Rate Limiting | Redis |
| `ms-auth-security` | 8081 | Autenticación y usuarios | `db_auth` |
| `ms-core-maestros` | 8082 | Catálogos (productos, mesas, etc.) | `db_maestros` |
| `ms-ventas` | 8083 | Pedidos y ventas | `db_ventas` |
| `ms-notificaciones` | 8084 | Notificaciones vía RabbitMQ | — |
| `ms-reportes` | 8085 | Reportes PDF / Excel (JasperReports) | — |

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Java 23, Spring Boot 3.3.5, Spring Cloud 2023.0.3 |
| Frontend | Angular 20, Ionic 8, TypeScript 5.8 |
| Base de datos | PostgreSQL 16 |
| Mensajería | RabbitMQ 3.13 |
| Caché / Rate limit | Redis 7.2 |
| Service Discovery | Netflix Eureka |
| Config. centralizada | Spring Cloud Config Server (modo nativo) |
| Resiliencia | Resilience4j (Circuit Breaker, Feign) |
| Seguridad | Spring Security + JWT (JJWT 0.12) |
| Migraciones BD | Flyway |
| Métricas | Micrometer + Prometheus + Grafana |
| Calidad código | SonarQube 10.5 |
| Reportes | JasperReports + iText + Apache POI |

---

## Comandos útiles

```bash
# Ver logs en tiempo real de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f ms-auth

# Ver estado de todos los contenedores
docker ps --format "table {{.Names}}\t{{.Status}}"

# Reiniciar un servicio sin reconstruir
docker-compose restart ms-ventas

# Reconstruir y reiniciar un servicio específico (tras cambios en el código)
docker-compose up --build -d ms-auth

# Parar todo (conserva volúmenes / datos)
docker-compose down

# Parar todo y ELIMINAR datos (limpieza total)
docker-compose down -v

# Ver uso de recursos
docker stats
```

---

## Validar puertos con inicio automático

```powershell
# Windows — valida puertos y levanta el stack si todo está libre
.\check-ports.ps1 -AutoStart
```

```bash
# Mac / Linux
./check-ports.sh --auto-start
```

---

## Estructura del proyecto

```
ArquitecturaRestaurant/
├── docker-compose.yml              ← Orquestación completa
├── check-ports.ps1                 ← Validador de puertos (Windows)
├── check-ports.sh                  ← Validador de puertos (Mac/Linux)
├── docker/
│   └── init-db.sql                 ← Crea db_auth, db_maestros, db_ventas, db_sonar
├── Backend/restaurant-backend/
│   ├── eureka-server/              ← Service Discovery  :8761
│   ├── config-server/              ← Config Server      :8888
│   ├── api-gateway/                ← API Gateway        :8080
│   ├── ms-auth-security/           ← Auth               :8081
│   ├── ms-core-maestros/           ← Maestros           :8082
│   ├── ms-ventas/                  ← Ventas             :8083
│   ├── ms-notificaciones/          ← Notificaciones     :8084
│   ├── ms-reportes/                ← Reportes           :8085
│   ├── common/                     ← Librería compartida (DTOs, excepciones)
│   ├── prometheus.yml              ← Scrape config Prometheus
│   └── grafana/                    ← Dashboards y datasources
└── Front/restaurant-frontend/      ← Angular 20 + Ionic  :4200
```

---

## Análisis de calidad con SonarQube

1. Inicia sesión en http://localhost:9000 (`admin`/`admin`)
2. Genera un token en **My Account → Security**
3. Ejecuta desde la raíz del backend:

```bash
cd Backend/restaurant-backend
mvn clean verify sonar:sonar \
  -Dsonar.projectKey=restaurant-backend \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=TU_TOKEN
```

---

## Desarrollo local (sin Docker para los microservicios)

Si prefieres correr los microservicios desde el IDE:

1. Levanta solo la infraestructura:
```bash
docker-compose up -d postgres rabbitmq redis eureka-server config-server
```

2. Arranca los microservicios desde IntelliJ/VSCode en este orden:
   - `eureka-server` → `config-server` → `ms-auth-security` → `ms-core-maestros` → `ms-ventas` → `ms-notificaciones` → `ms-reportes` → `api-gateway`

3. Para el frontend:
```bash
cd Front/restaurant-frontend
npm install
npm start
```

---

## Solución de problemas comunes

| Problema | Causa | Solución |
|---|---|---|
| Puerto ocupado | Proceso local corriendo | Ejecutar `check-ports.ps1` para ver qué proceso es |
| RabbitMQ no inicia | Cookie corrupta en volumen | `docker volume rm arquitecturarestaurant_rabbitmq_data` |
| Servicio no se registra en Eureka | Arrancó antes que Eureka | Esperar 2 min o `docker-compose restart <servicio>` |
| Frontend no conecta a la API | Gateway no saludable | Verificar `docker logs restaurant-gateway` |
| SonarQube no inicia | Memoria insuficiente | Asignar al menos 4 GB de RAM a Docker Desktop |
