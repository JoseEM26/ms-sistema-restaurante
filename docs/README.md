# 📚 Documentación — Sistema de Gestión de Restaurante

Documentación técnica completa del sistema **Restaurant Manager**, un proyecto full-stack construido con microservicios Spring Cloud en el backend y Angular 20 en el frontend.

---

## 📁 Estructura de la documentación

```
docs/
├── README.md                        ← Este archivo (índice)
│
├── backend/
│   ├── 01-arquitectura.md           ← Visión general de microservicios
│   ├── 02-stack-tecnologico.md      ← Todas las tecnologías del backend
│   ├── 03-microservicios.md         ← Cada microservicio explicado
│   └── 04-logica-de-negocio.md      ← Flujos y reglas de negocio
│
├── frontend/
│   ├── 01-arquitectura.md           ← Clean Architecture + Angular
│   ├── 02-stack-tecnologico.md      ← Angular, Ionic, Tailwind, etc.
│   ├── 03-modulos-y-features.md     ← Cada módulo explicado
│   └── 04-estado-y-reactividad.md   ← Signals, Facades, Stores
│
├── infraestructura/
│   ├── 01-docker.md                 ← Docker Compose, contenedores
│   ├── 02-observabilidad.md         ← Prometheus, Grafana, Actuator
│   └── 03-mensajeria.md             ← RabbitMQ, eventos asíncronos
│
├── base-de-datos/
│   ├── 01-modelo-de-datos.md        ← Esquema y relaciones
│   └── 02-flyway-y-seeds.md         ← Migraciones y datos de prueba
│
├── seguridad/
│   └── 01-jwt-y-autenticacion.md    ← JWT, Spring Security, roles
│
└── testing/
    └── 01-estrategia-de-testing.md  ← JUnit, Testcontainers, JaCoCo
```

---

## 🚀 Inicio rápido

```bash
# 1. Levantar infraestructura Docker
cd Backend/restaurant-backend
docker compose up -d

# 2. Arrancar backend (desde IntelliJ o BAT)
start-all.bat

# 3. Levantar frontend
cd Front/restaurant-frontend
npm install && npm start
```

**Accesos:**

| Servicio | URL | Credenciales |
|---|---|---|
| Frontend | http://localhost:4200 | admin / admin123 |
| API Gateway | http://localhost:8080 | — |
| Eureka | http://localhost:8761 | — |
| Swagger | http://localhost:8080/swagger-ui.html | — |
| RabbitMQ | http://localhost:15672 | guest / guest |
| Grafana | http://localhost:3001 | admin / admin |

---

## 🏗️ Visión de alto nivel

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                           │
│          Angular 20 + Ionic + Tailwind               │
│   Clean Architecture (domain/application/infra)     │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP/REST + JWT
┌───────────────────────▼─────────────────────────────┐
│               API GATEWAY :8080                      │
│     Spring Cloud Gateway + JWT Filter + Redis        │
└──┬───────────┬──────────┬─────────────┬─────────────┘
   │           │          │             │
   ▼           ▼          ▼             ▼
:8081       :8082       :8083         :8085
Auth      Maestros    Ventas        Reportes
  │           │          │
  ▼           ▼          │──RabbitMQ──▶ :8084
db_auth  db_maestros  db_ventas      Notificaciones
```
