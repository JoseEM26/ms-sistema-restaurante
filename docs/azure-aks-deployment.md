# Despliegue en Azure con Kubernetes (AKS)

> Este documento asume que ya tienes la carpeta `k8s/` con todos los manifiestos del proyecto.
> Es diferente a `azure-deployment.md` que usa Container Apps (serverless).
> Aquí usamos **Azure Kubernetes Service (AKS)** — K8s gestionado por Azure.

---

## ¿Por qué AKS y no Container Apps?

| | Azure Container Apps | Azure Kubernetes Service (AKS) |
|---|---|---|
| Control | Bajo (Azure gestiona todo) | Total (tú controlas el cluster) |
| Curva de aprendizaje | Baja | Alta |
| Reusar nuestros `k8s/` | No directamente | Sí, directamente con `kubectl apply` |
| Escalar | Automático y simple | Manual o con HPA (Horizontal Pod Autoscaler) |
| Precio | Por consumo | Por nodos (VMs corriendo 24/7) |
| Para aprender K8s | No | Sí |

**Usamos AKS porque ya tenemos los manifiestos `k8s/` listos** — los mismos archivos que probamos con Minikube se despliegan en AKS sin cambios.

---

## Arquitectura en Azure con AKS

El sistema tiene dos planos: el **plano de despliegue** (cómo llegan las imágenes al cluster)
y el **plano de tráfico** (cómo fluyen los requests del usuario).

### Plano de despliegue (build → registry → cluster)

```
Tu código (GitHub)
       │
       ▼  GitHub Actions CI/CD
┌─────────────────────────────────────┐
│  Azure Container Registry (ACR)     │  ← pago aparte, ~$5/mes
│  acrrestaurantk8s.azurecr.io        │    guarda las imágenes Docker
│  ┌────────────────────────────────┐ │    de todos los microservicios
│  │ ms-auth:1.0.0                 │ │
│  │ ms-ventas:1.0.0               │ │
│  │ api-gateway:1.0.0             │ │
│  │ frontend:1.0.0  ... (9 imgs)  │ │
│  └────────────────────────────────┘ │
└──────────────────┬──────────────────┘
                   │  kubectl pull images
                   ▼
         AKS Cluster (los pods descargan
         sus imágenes desde ACR al arrancar)
```

### Plano de tráfico (usuario → app)

```
Internet
   │
   ▼
┌────────────────────────────────────────────┐
│         Azure Front Door (CDN + WAF)        │  ← pago aparte, ~$35/mes
└──────────┬─────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Azure Load Balancer  (IP pública)                                    │
│  creado AUTOMÁTICAMENTE por AKS al instalar nginx-ingress             │
│  INCLUIDO en el costo de AKS (~$18/mes adicional al nodo)            │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  AKS Cluster  (servicio gestionado de Azure, ~$60/mes)         │  │
│  │                                                                 │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │  nginx Ingress Controller  (pods dentro del cluster)      │  │  │
│  │  │  NO es un servicio Azure separado — corre DENTRO de AKS  │  │  │
│  │  └──────────────────┬───────────────────────────────────────┘  │  │
│  │                     │  enruta según la URL                      │  │
│  │          ┌──────────┴──────────────┐                           │  │
│  │          ▼                         ▼                           │  │
│  │  /  → frontend (nginx)      /api → api-gateway                 │  │
│  │                                    │                           │  │
│  │                         ┌──────────┼──────────┐               │  │
│  │                         ▼          ▼          ▼               │  │
│  │                      ms-auth   ms-ventas  ms-maestros          │  │
│  │                      ms-notif  ms-reportes                     │  │
│  │                                                                 │  │
│  │                      eureka-server  config-server              │  │
│  │                      (solo red interna, sin Ingress)           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
           │
           │  red privada (no pasa por internet)
           ▼
┌──────────────────────────────────────────────────────┐
│  Servicios gestionados de Azure (fuera del cluster)  │
│                                                       │
│  Azure Database for PostgreSQL    ~$60/mes           │
│  Azure Cache for Redis            ~$55/mes           │
│  Azure Service Bus (RabbitMQ)     ~$10/mes           │
│  Azure Key Vault (secretos)       ~$1/mes            │
└──────────────────────────────────────────────────────┘
```

### Resumen: ¿qué es parte de AKS y qué es pago aparte?

| Componente | ¿Está dentro de AKS? | Costo |
|---|---|---|
| **nginx Ingress Controller** | ✅ SÍ — son pods dentro del cluster | Incluido en el nodo AKS |
| **Azure Load Balancer** | ⚠️ Lo crea AKS automáticamente | ~$18/mes extra (fuera del nodo) |
| **AKS Cluster (nodos)** | — Es el servicio en sí | ~$60/mes (2 nodos B2s) |
| **Azure Container Registry** | ❌ NO — servicio separado | ~$5/mes |
| **Azure Database PostgreSQL** | ❌ NO — servicio separado | ~$60/mes |
| **Azure Cache for Redis** | ❌ NO — servicio separado | ~$55/mes |
| **Azure Service Bus** | ❌ NO — servicio separado | ~$10/mes |
| **Azure Front Door** | ❌ NO — servicio separado (opcional) | ~$35/mes |

---

## Servicios Azure necesarios

| Servicio | Para qué | Tier recomendado |
|---|---|---|
| **Azure Kubernetes Service (AKS)** | Cluster K8s gestionado | Standard B2s (2 nodos) |
| **Azure Container Registry (ACR)** | Guardar imágenes Docker | Basic |
| **Azure Database for PostgreSQL** | Base de datos | Burstable B2s |
| **Azure Cache for Redis** | Rate limiting del gateway | C1 Standard |
| **Azure Service Bus** | Reemplaza RabbitMQ | Standard |
| **Azure Key Vault** | Secretos (JWT, contraseñas) | Standard |
| **Azure Front Door** | CDN + entrada global | Standard |
| **Azure Static Web Apps** | Hosting del frontend Angular | Free |
| **Azure Monitor + Log Analytics** | Logs y métricas del cluster | Pay-as-you-go |

---

## Paso 1 — Crear el cluster AKS

```bash
# Login a Azure
az login

# Crear Resource Group
az group create \
  --name rg-restaurant-k8s \
  --location eastus

# Crear Azure Container Registry (para las imágenes Docker)
az acr create \
  --resource-group rg-restaurant-k8s \
  --name acrrestaurantk8s \
  --sku Basic

# Crear el cluster AKS con 2 nodos
az aks create \
  --resource-group rg-restaurant-k8s \
  --name aks-restaurant \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --attach-acr acrrestaurantk8s \
  --enable-addons monitoring \
  --generate-ssh-keys

# Conectar kubectl al cluster
az aks get-credentials \
  --resource-group rg-restaurant-k8s \
  --name aks-restaurant

# Verificar conexión
kubectl get nodes
```

---

## Paso 2 — Instalar el Ingress Controller

El Ingress de nuestro `k8s/ingress.yaml` necesita un controlador nginx instalado en el cluster:

```bash
# Agregar el repo de helm para nginx-ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Instalar nginx ingress controller
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# Obtener la IP pública asignada (esperar 1-2 min)
kubectl get service ingress-nginx-controller -n ingress-nginx
```

---

## Paso 3 — Construir y subir imágenes a ACR

En vez de usar imágenes locales de Minikube, las subimos a ACR:

```bash
# Login al registry
az acr login --name acrrestaurantk8s

# Build y push de cada microservicio
ACR=acrrestaurantk8s.azurecr.io

docker build -t $ACR/eureka-server:1.0.0    ./Backend/restaurant-backend --file Backend/restaurant-backend/eureka-server/Dockerfile
docker build -t $ACR/config-server:1.0.0    ./Backend/restaurant-backend --file Backend/restaurant-backend/config-server/Dockerfile
docker build -t $ACR/api-gateway:1.0.0      ./Backend/restaurant-backend --file Backend/restaurant-backend/api-gateway/Dockerfile
docker build -t $ACR/ms-auth-security:1.0.0 ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-auth-security/Dockerfile
docker build -t $ACR/ms-core-maestros:1.0.0 ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-core-maestros/Dockerfile
docker build -t $ACR/ms-ventas:1.0.0        ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-ventas/Dockerfile
docker build -t $ACR/ms-notificaciones:1.0.0 ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-notificaciones/Dockerfile
docker build -t $ACR/ms-reportes:1.0.0      ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-reportes/Dockerfile
docker build -t $ACR/frontend:1.0.0         ./Front/restaurant-frontend

# Push de todas las imágenes
docker push $ACR/eureka-server:1.0.0
docker push $ACR/config-server:1.0.0
docker push $ACR/api-gateway:1.0.0
docker push $ACR/ms-auth-security:1.0.0
docker push $ACR/ms-core-maestros:1.0.0
docker push $ACR/ms-ventas:1.0.0
docker push $ACR/ms-notificaciones:1.0.0
docker push $ACR/ms-reportes:1.0.0
docker push $ACR/frontend:1.0.0
```

---

## Paso 4 — Actualizar los manifiestos para apuntar a ACR

Los manifiestos en `k8s/backend/` usan `image: restaurant/...`. En AKS deben apuntar al ACR:

```bash
ACR=acrrestaurantk8s.azurecr.io

# Reemplazar el prefijo de imagen en todos los manifiestos
sed -i "s|image: restaurant/|image: $ACR/|g" k8s/backend/*.yaml
sed -i "s|image: restaurant/|image: $ACR/|g" k8s/frontend/frontend.yaml
```

---

## Paso 5 — Crear servicios gestionados de Azure

```bash
# PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group rg-restaurant-k8s \
  --name psql-restaurant-prod \
  --location eastus \
  --sku-name Standard_B2s \
  --tier Burstable \
  --admin-user postgres \
  --admin-password "TuPasswordSegura123!" \
  --yes

# Crear las 4 bases de datos
az postgres flexible-server db create --resource-group rg-restaurant-k8s --server-name psql-restaurant-prod --database-name db_auth
az postgres flexible-server db create --resource-group rg-restaurant-k8s --server-name psql-restaurant-prod --database-name db_maestros
az postgres flexible-server db create --resource-group rg-restaurant-k8s --server-name psql-restaurant-prod --database-name db_ventas
az postgres flexible-server db create --resource-group rg-restaurant-k8s --server-name psql-restaurant-prod --database-name db_sonar

# Redis Cache
az redis create \
  --resource-group rg-restaurant-k8s \
  --name redis-restaurant-prod \
  --location eastus \
  --sku Standard \
  --vm-size c1

# Key Vault para secretos
az keyvault create \
  --resource-group rg-restaurant-k8s \
  --name kv-restaurant-prod \
  --location eastus
```

---

## Paso 6 — Actualizar el ConfigMap y Secrets con datos de Azure

Editar `k8s/configmap.yaml` con los endpoints reales de Azure:

```yaml
data:
  SPRING_DATASOURCE_URL: jdbc:postgresql://psql-restaurant-prod.postgres.database.azure.com:5432/db_auth?sslmode=require
  SPRING_RABBITMQ_HOST: sb-restaurant-prod.servicebus.windows.net
  SPRING_DATA_REDIS_HOST: redis-restaurant-prod.redis.cache.windows.net
  SPRING_DATA_REDIS_PORT: "6380"
  SPRING_DATA_REDIS_SSL_ENABLED: "true"
```

---

## Paso 7 — Desplegar en AKS

Los mismos manifiestos de Minikube funcionan en AKS:

```bash
# Aplicar en orden
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/infra/pvc.yaml

# Infraestructura (si usas PostgreSQL/Redis/RabbitMQ en K8s)
# Si usas los servicios gestionados de Azure, saltar este paso
kubectl apply -f k8s/infra/

# Backend
kubectl apply -f k8s/backend/eureka.yaml
kubectl wait --for=condition=ready pod -l app=eureka-server -n restaurant --timeout=180s

kubectl apply -f k8s/backend/config-server.yaml
kubectl wait --for=condition=ready pod -l app=config-server -n restaurant --timeout=180s

kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/monitoring/
kubectl apply -f k8s/ingress.yaml

# Verificar
kubectl get pods -n restaurant
kubectl get ingress -n restaurant
```

---

## Pipeline CI/CD — GitHub Actions para AKS

```yaml
# .github/workflows/deploy-aks.yml
name: Build & Deploy to AKS

on:
  push:
    branches: [main]

env:
  ACR_NAME: acrrestaurantk8s
  AKS_CLUSTER: aks-restaurant
  RESOURCE_GROUP: rg-restaurant-k8s

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login a Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Login a ACR
        run: az acr login --name $ACR_NAME

      - name: Build y Push imágenes
        run: |
          ACR=$ACR_NAME.azurecr.io
          TAG=${{ github.sha }}

          docker build -t $ACR/api-gateway:$TAG \
            ./Backend/restaurant-backend \
            --file Backend/restaurant-backend/api-gateway/Dockerfile
          docker push $ACR/api-gateway:$TAG

          # Repetir por cada microservicio...

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login a Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Conectar kubectl a AKS
        run: |
          az aks get-credentials \
            --resource-group $RESOURCE_GROUP \
            --name $AKS_CLUSTER

      - name: Actualizar imagen en el cluster
        run: |
          ACR=$ACR_NAME.azurecr.io
          TAG=${{ github.sha }}

          kubectl set image deployment/api-gateway \
            api-gateway=$ACR/api-gateway:$TAG \
            -n restaurant

          # Repetir por cada microservicio...

      - name: Verificar despliegue
        run: kubectl rollout status deployment/api-gateway -n restaurant
```

---

## Escalado automático (HPA)

Una ventaja de AKS sobre Minikube — puedes escalar automáticamente según la carga:

```yaml
# k8s/backend/ms-ventas-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ms-ventas-hpa
  namespace: restaurant
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ms-ventas
  minReplicas: 1
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

```bash
kubectl apply -f k8s/backend/ms-ventas-hpa.yaml

# Ver el autoscaler en acción
kubectl get hpa -n restaurant
```

---

## Estimación de costos en AKS (East US)

| Servicio | Tier | Costo aprox/mes |
|---|---|---|
| AKS (2 nodos Standard_B2s) | Standard | ~$60 |
| Azure Container Registry | Basic | ~$5 |
| Azure Database PostgreSQL | Burstable B2s | ~$60 |
| Azure Cache for Redis | C1 Standard | ~$55 |
| Azure Service Bus | Standard | ~$10 |
| Azure Key Vault | Standard | ~$1 |
| Azure Monitor + Log Analytics | Pay-as-you-go | ~$15 |
| Azure Front Door | Standard | ~$35 |
| Azure Static Web Apps | Free | $0 |
| **TOTAL estimado** | | **~$240–260/mes** |

> AKS es ~$30-40 más caro que Container Apps porque pagas por los nodos 24/7.
> Para dev/staging usar 1 nodo Standard_B2s reduce el costo a ~$120/mes.

---

## Diferencias clave vs el deploy con Minikube local

| | Minikube (local) | AKS (Azure) |
|---|---|---|
| Imágenes Docker | Build local con `eval $(minikube docker-env)` | Subir a ACR con `docker push` |
| Base de datos | PostgreSQL dentro del cluster (PVC local) | Azure Database for PostgreSQL (managed) |
| Redis | Redis dentro del cluster | Azure Cache for Redis (managed) |
| RabbitMQ | RabbitMQ dentro del cluster | Azure Service Bus (managed) |
| Ingress IP | IP local de Minikube | IP pública de Azure Load Balancer |
| Acceso | Solo desde tu máquina | Desde internet |
| Alta disponibilidad | No | Sí (múltiples nodos) |
| Backups BD | No | Automáticos en Azure |

---

## Comandos útiles en AKS

```bash
# Ver todos los pods
kubectl get pods -n restaurant

# Ver logs de un microservicio
kubectl logs -f deployment/ms-auth -n restaurant

# Escalar manualmente ms-ventas a 3 réplicas
kubectl scale deployment ms-ventas --replicas=3 -n restaurant

# Ver el ingress y su IP pública
kubectl get ingress -n restaurant

# Hacer rolling update a una nueva versión
kubectl set image deployment/ms-auth ms-auth=acrrestaurantk8s.azurecr.io/ms-auth-security:2.0.0 -n restaurant

# Rollback si algo falla
kubectl rollout undo deployment/ms-auth -n restaurant

# Ver uso de recursos del cluster
kubectl top nodes
kubectl top pods -n restaurant

# Eliminar todo el namespace (borra todos los recursos)
kubectl delete namespace restaurant
```
