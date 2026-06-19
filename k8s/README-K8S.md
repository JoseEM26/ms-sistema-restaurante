# Kubernetes — Explicación completa del stack

## ¿Qué hicimos?

Tomamos el mismo proyecto que corría con `docker-compose up` y lo trasladamos a Kubernetes. El resultado es que en vez de un solo archivo `docker-compose.yml`, ahora tenemos una carpeta `k8s/` con **21 archivos YAML** que Kubernetes entiende.

---

## ¿Por qué Kubernetes en vez de solo Docker Compose?

| | Docker Compose | Kubernetes |
|---|---|---|
| ¿Dónde corre? | Una sola máquina | Múltiples máquinas (cluster) |
| Si un servicio falla | Lo reinicia (básico) | Lo reinicia automáticamente y notifica |
| Escalar un servicio | Tienes que hacerlo manual | `kubectl scale --replicas=3` |
| Actualizaciones | Para el servicio, actualiza, vuelve a subir | Rolling update sin cortar el servicio |
| Balanceo de carga | No tiene | Nativo |
| ¿Para producción real? | No se recomienda | Sí, es el estándar de la industria |

Docker Compose es ideal para **desarrollo local**. Kubernetes es para cuando el sistema necesita estar disponible 24/7, soportar carga real y escalar.

---

## Estructura de archivos y por qué cada uno

```
k8s/
├── namespace.yaml       ← agrupa todos nuestros recursos
├── configmap.yaml       ← variables de entorno no sensibles
├── secrets.yaml         ← contraseñas y claves encriptadas
├── ingress.yaml         ← puerta de entrada desde el exterior
├── deploy.sh            ← script que lo despliega todo en orden
│
├── infra/
│   ├── pvc.yaml         ← espacio en disco para datos persistentes
│   ├── postgres.yaml
│   ├── rabbitmq.yaml
│   └── redis.yaml
│
├── backend/
│   ├── eureka.yaml
│   ├── config-server.yaml
│   ├── ms-auth.yaml
│   ├── ms-maestros.yaml
│   ├── ms-ventas.yaml
│   ├── ms-notif.yaml
│   ├── ms-reportes.yaml
│   └── api-gateway.yaml
│
├── frontend/
│   └── frontend.yaml
│
└── monitoring/
    ├── prometheus.yaml
    ├── grafana.yaml
    └── sonarqube.yaml
```

---

## ¿Por qué casi todo es un Deployment?

Esa es la pregunta clave. En Kubernetes existen varios tipos de recursos para correr contenedores:

### `Deployment` — el más común
Se usa para aplicaciones **sin estado (stateless)**, es decir, que no guardan datos en disco.

```yaml
kind: Deployment
```

Características:
- Kubernetes puede crear y destruir réplicas libremente
- Si una réplica muere, K8s crea otra en cualquier nodo disponible
- Soporta rolling updates (actualiza de a uno sin cortar el servicio)
- Soporta rollback si algo sale mal

**Todos nuestros microservicios Spring Boot son stateless** — no guardan nada en disco, solo procesan requests y hablan con la BD. Por eso son `Deployment`.

Lo mismo aplica para:
- `eureka-server` → no guarda datos en disco
- `config-server` → lee configs del classpath, no escribe
- `api-gateway` → solo enruta, guarda estado en Redis (externo)
- `frontend (nginx)` → solo sirve archivos estáticos
- `prometheus`, `grafana` → aunque tienen datos, en este setup los manejamos con PVC

### ¿Cuándo NO se usa Deployment?

#### `StatefulSet` — para aplicaciones con estado
Se usa cuando el pod necesita una **identidad fija y almacenamiento propio**.

```yaml
kind: StatefulSet
```

Características:
- Cada pod tiene un nombre fijo: `postgres-0`, `postgres-1`, etc.
- Cada pod tiene su propio volumen que lo sigue aunque se mueva de nodo
- Los pods arrancan y se eliminan en orden (no en paralelo)

Se usa típicamente para: bases de datos en cluster (PostgreSQL HA, MongoDB replica set, Kafka, Elasticsearch).

> **¿Por qué usamos `Deployment` para PostgreSQL y no `StatefulSet`?**
>
> Porque tenemos **una sola réplica** (`replicas: 1`). Con una sola instancia, `Deployment` + `PersistentVolumeClaim` funciona perfectamente. `StatefulSet` solo aporta beneficios reales cuando escalaas a múltiples réplicas de la BD (clúster con líder y seguidores).

#### `DaemonSet` — un pod por nodo
Se usa cuando necesitas que **cada nodo** del cluster corra exactamente una instancia (por ejemplo: agente de logs, agente de monitoreo por nodo). No lo usamos.

#### `Job` / `CronJob` — tareas puntuales
Para ejecutar algo **una vez** (migraciones, seeds) o en un horario (reportes nocturnos). Tampoco los necesitamos porque Flyway ya corre las migraciones al arrancar cada microservicio.

---

## Anatomía de un archivo YAML de nuestro proyecto

Todos siguen la misma estructura. Ejemplo con `ms-auth`:

```yaml
# ── 1. DEPLOYMENT ──────────────────────────────────────────────
apiVersion: apps/v1
kind: Deployment           # tipo de recurso
metadata:
  name: ms-auth            # nombre interno en K8s
  namespace: restaurant    # grupo al que pertenece
spec:
  replicas: 1              # cuántas copias corren a la vez
  selector:
    matchLabels:
      app: ms-auth         # qué pods maneja este deployment
  template:                # plantilla del pod
    metadata:
      labels:
        app: ms-auth
    spec:
      containers:
        - name: ms-auth
          image: restaurant/ms-auth-security:1.0.0  # imagen Docker
          ports:
            - containerPort: 8081
          envFrom:
            - configMapRef:
                name: restaurant-config   # variables no sensibles
          env:
            - name: SPRING_DATASOURCE_PASSWORD
              valueFrom:
                secretKeyRef:             # contraseña desde Secret
                  name: restaurant-secrets
                  key: SPRING_DATASOURCE_PASSWORD
          readinessProbe:                 # ¿cuándo está listo?
            httpGet:
              path: /actuator/health
              port: 8081
            initialDelaySeconds: 90      # espera 90s antes de preguntar

# ── 2. SERVICE ─────────────────────────────────────────────────
apiVersion: v1
kind: Service              # expone el deployment en la red interna
metadata:
  name: ms-auth-service
  namespace: restaurant
spec:
  selector:
    app: ms-auth           # apunta a los pods del deployment
  ports:
    - port: 8081
      targetPort: 8081
```

**Cada servicio tiene DOS objetos:**
- `Deployment` → corre el contenedor
- `Service` → lo hace accesible por nombre dentro del cluster

---

## Recursos especiales explicados

### ConfigMap — variables de entorno no sensibles
```yaml
kind: ConfigMap
```
Centraliza todas las variables que no son secretas (hosts, puertos, flags). En vez de repetirlas en cada YAML, todos los deployments hacen `envFrom: configMapRef`.

Equivalente en docker-compose: las variables `environment:` de cada servicio.

### Secret — contraseñas y claves
```yaml
kind: Secret
```
Igual que ConfigMap pero los valores están codificados en base64 y K8s los trata con más cuidado (no los muestra en logs, se pueden encriptar en disco).

Contiene: contraseñas de BD, JWT secret, cookie de RabbitMQ.

### PersistentVolumeClaim (PVC) — disco persistente
```yaml
kind: PersistentVolumeClaim
```
Los contenedores en K8s son **efímeros** — si el pod muere, sus datos desaparecen. Un PVC le pide al cluster un trozo de disco que persiste aunque el pod se destruya y vuelva a crear.

Lo usamos para: PostgreSQL, RabbitMQ, Redis, Prometheus, Grafana, SonarQube.

### Ingress — la puerta de entrada
```yaml
kind: Ingress
```
Recibe el tráfico del exterior y lo distribuye a los servicios internos según la ruta:

```
http://restaurant.local/       → frontend-service:80
http://restaurant.local/api    → api-gateway-service:8080
http://restaurant.local/eureka → eureka-service:8761
```

Equivalente en docker-compose: los `ports:` de cada servicio + el nginx del frontend.

---

## readinessProbe vs livenessProbe

Ambas hacen un `GET /actuator/health` pero sirven para cosas distintas:

| | readinessProbe | livenessProbe |
|---|---|---|
| ¿Qué pregunta? | ¿Está listo para recibir tráfico? | ¿Sigue vivo? |
| Si falla | K8s deja de enviarle requests | K8s reinicia el pod |
| Para qué sirve | Esperar a que Spring Boot cargue | Detectar que el proceso se colgó |

Los microservicios Spring Boot tardan ~90 segundos en arrancar, por eso `initialDelaySeconds: 90`. Sin este delay, K8s pensaría que el pod falló y lo reinicaría en bucle antes de que siquiera termine de cargar.

---

## ¿Cómo se diferencia del docker-compose?

| docker-compose.yml | Kubernetes |
|---|---|
| `image:` | `image:` en el Deployment |
| `environment:` | `ConfigMap` + `Secret` |
| `ports:` | `Service` (ClusterIP) + `Ingress` |
| `volumes:` | `PersistentVolumeClaim` |
| `depends_on:` | `readinessProbe` + orden en `deploy.sh` |
| `networks:` | Namespace (todos los pods del mismo namespace se ven) |
| `healthcheck:` | `readinessProbe` + `livenessProbe` |

---

## Cómo desplegarlo

### Requisitos
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) instalado
- Docker instalado

### Desplegar
```bash
# Desde la raíz del proyecto
bash k8s/deploy.sh
```

El script hace automáticamente:
1. Inicia Minikube si no está corriendo
2. Construye todas las imágenes Docker dentro de Minikube
3. Aplica los manifiestos en el orden correcto
4. Espera que cada servicio crítico esté `Ready` antes de continuar

### Ver estado
```bash
kubectl get pods -n restaurant
kubectl get services -n restaurant
```

### Ver logs de un servicio
```bash
kubectl logs -f deployment/ms-auth -n restaurant
```

### Eliminar todo
```bash
bash k8s/deploy.sh --delete
```

### Escalar un servicio (la ventaja real de K8s)
```bash
# Correr 3 instancias de ms-ventas en paralelo
kubectl scale deployment ms-ventas --replicas=3 -n restaurant
```
