# Despliegue en AWS con Kubernetes (EKS)

> Este documento es el equivalente de `azure-aks-deployment.md` pero para Amazon Web Services.
> El servicio de Kubernetes gestionado de AWS se llama **EKS** (Elastic Kubernetes Service).
> Los mismos manifiestos `k8s/` del proyecto funcionan en EKS — kubectl es el mismo.

---

## Equivalencias AWS ↔ Azure

| Azure | AWS | Para qué |
|---|---|---|
| AKS (Azure Kubernetes Service) | **EKS** (Elastic Kubernetes Service) | Cluster K8s gestionado |
| ACR (Azure Container Registry) | **ECR** (Elastic Container Registry) | Guardar imágenes Docker |
| Azure Database for PostgreSQL | **RDS for PostgreSQL** | Base de datos gestionada |
| Azure Cache for Redis | **ElastiCache for Redis** | Cache / rate limiting |
| Azure Service Bus | **Amazon MQ** (RabbitMQ managed) | Mensajería |
| Azure Key Vault | **AWS Secrets Manager** | Secretos y contraseñas |
| Azure Front Door | **CloudFront + WAF** | CDN + protección |
| Azure Static Web Apps | **AWS Amplify** | Hosting frontend Angular |
| Azure Monitor + Log Analytics | **CloudWatch** | Logs y métricas del cluster |
| Azure Load Balancer | **ALB** (Application Load Balancer) | IP pública del cluster |

---

## Arquitectura en AWS con EKS

### Plano de despliegue (build → registry → cluster)

```
Tu código (GitHub)
       │
       ▼  GitHub Actions CI/CD
┌─────────────────────────────────────┐
│  Amazon ECR                         │  ← pago aparte, ~$1-5/mes
│  123456789.dkr.ecr.us-east-1...    │    guarda las imágenes Docker
│  ┌────────────────────────────────┐ │    de todos los microservicios
│  │ ms-auth:1.0.0                 │ │
│  │ ms-ventas:1.0.0               │ │
│  │ api-gateway:1.0.0             │ │
│  │ frontend:1.0.0  ... (9 imgs)  │ │
│  └────────────────────────────────┘ │
└──────────────────┬──────────────────┘
                   │  kubectl pull images
                   ▼
         EKS Cluster (los pods descargan
         sus imágenes desde ECR al arrancar)
```

### Plano de tráfico (usuario → app)

```
Internet
   │
   ▼
┌────────────────────────────────────────────┐
│     Amazon CloudFront (CDN + WAF)           │  ← pago aparte, ~$20/mes
└──────────┬─────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ALB — Application Load Balancer (IP pública)                         │
│  creado AUTOMÁTICAMENTE por EKS al instalar AWS Load Balancer Ctrl   │
│  INCLUIDO en el costo de EKS (~$16/mes adicional)                    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  EKS Cluster  (servicio gestionado de AWS, ~$73/mes)           │  │
│  │                                                                 │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │  nginx Ingress Controller  (pods dentro del cluster)      │  │  │
│  │  │  NO es un servicio AWS separado — corre DENTRO de EKS    │  │  │
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
           │  red privada VPC (no pasa por internet)
           ▼
┌──────────────────────────────────────────────────────┐
│  Servicios gestionados de AWS (fuera del cluster)    │
│                                                       │
│  Amazon RDS for PostgreSQL        ~$50/mes           │
│  Amazon ElastiCache for Redis     ~$25/mes           │
│  Amazon MQ (RabbitMQ managed)     ~$30/mes           │
│  AWS Secrets Manager              ~$1/mes            │
└──────────────────────────────────────────────────────┘
```

### Resumen: ¿qué es parte de EKS y qué es pago aparte?

| Componente | ¿Está dentro de EKS? | Costo |
|---|---|---|
| **nginx Ingress Controller** | ✅ SÍ — pods dentro del cluster | Incluido en el nodo EC2 |
| **ALB (Application Load Balancer)** | ⚠️ Lo crea EKS automáticamente | ~$16/mes extra |
| **EKS Cluster (control plane)** | — Es el servicio en sí | $73/mes (plano de control fijo) |
| **Nodos EC2 (worker nodes)** | Son VMs que EKS gestiona | ~$60/mes (2 × t3.medium) |
| **Amazon ECR** | ❌ NO — servicio separado | ~$1-5/mes |
| **Amazon RDS PostgreSQL** | ❌ NO — servicio separado | ~$50/mes |
| **Amazon ElastiCache Redis** | ❌ NO — servicio separado | ~$25/mes |
| **Amazon MQ** | ❌ NO — servicio separado | ~$30/mes |
| **CloudFront + WAF** | ❌ NO — servicio separado (opcional) | ~$20/mes |

> **Nota:** EKS cobra $0.10/hora (~$73/mes) solo por el plano de control (la API de K8s).
> Adicionalmente pagas los nodos EC2 donde corren tus pods.
> Azure AKS no cobra por el plano de control — solo por los nodos. AWS sí.

---

## Herramientas necesarias

```bash
# AWS CLI
# Windows: descarga el instalador desde aws.amazon.com/cli
aws --version

# eksctl — herramienta oficial para crear clusters EKS (equivalente a az aks create)
# Windows con Chocolatey:
choco install eksctl

# kubectl (ya lo tienes si usas Minikube)
kubectl version

# helm (para el Ingress Controller)
helm version
```

---

## Paso 1 — Configurar AWS CLI

```bash
# Configurar credenciales (necesitas una cuenta AWS y un usuario IAM)
aws configure
# AWS Access Key ID: [tu access key]
# AWS Secret Access Key: [tu secret key]
# Default region name: us-east-1
# Default output format: json

# Verificar identidad
aws sts get-caller-identity
```

---

## Paso 2 — Crear el cluster EKS

Con `eksctl` (la forma más fácil, equivalente a `az aks create`):

```bash
# Crear el cluster con 2 nodos t3.medium
eksctl create cluster \
  --name eks-restaurant \
  --region us-east-1 \
  --nodegroup-name restaurant-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed

# Esto tarda ~15-20 minutos (crea VPC, subnets, nodos EC2, etc.)
# eksctl configura kubectl automáticamente al terminar

# Verificar conexión
kubectl get nodes
```

---

## Paso 3 — Instalar el Ingress Controller

Igual que en AKS, usamos nginx-ingress con Helm:

```bash
# Agregar el repo de helm
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Instalar nginx ingress controller
# En AWS necesita anotar que use un ALB
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer

# Obtener el hostname del ALB (esperar 2-3 min)
kubectl get service ingress-nginx-controller -n ingress-nginx
# EXTERNAL-IP será algo como: abc123.us-east-1.elb.amazonaws.com
```

---

## Paso 4 — Crear el registry ECR y subir imágenes

Amazon ECR es el equivalente de ACR (Azure Container Registry):

```bash
# Obtener el ID de tu cuenta AWS
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1
ECR=$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com

# Crear un repositorio ECR por cada microservicio
for SERVICE in eureka-server config-server api-gateway ms-auth-security ms-core-maestros ms-ventas ms-notificaciones ms-reportes frontend; do
  aws ecr create-repository --repository-name $SERVICE --region $AWS_REGION
done

# Login al registry ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR

# Build y push de cada microservicio
docker build -t $ECR/eureka-server:1.0.0     ./Backend/restaurant-backend --file Backend/restaurant-backend/eureka-server/Dockerfile
docker build -t $ECR/config-server:1.0.0     ./Backend/restaurant-backend --file Backend/restaurant-backend/config-server/Dockerfile
docker build -t $ECR/api-gateway:1.0.0       ./Backend/restaurant-backend --file Backend/restaurant-backend/api-gateway/Dockerfile
docker build -t $ECR/ms-auth-security:1.0.0  ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-auth-security/Dockerfile
docker build -t $ECR/ms-core-maestros:1.0.0  ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-core-maestros/Dockerfile
docker build -t $ECR/ms-ventas:1.0.0         ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-ventas/Dockerfile
docker build -t $ECR/ms-notificaciones:1.0.0 ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-notificaciones/Dockerfile
docker build -t $ECR/ms-reportes:1.0.0       ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-reportes/Dockerfile
docker build -t $ECR/frontend:1.0.0          ./Front/restaurant-frontend

# Push de todas las imágenes
docker push $ECR/eureka-server:1.0.0
docker push $ECR/config-server:1.0.0
docker push $ECR/api-gateway:1.0.0
docker push $ECR/ms-auth-security:1.0.0
docker push $ECR/ms-core-maestros:1.0.0
docker push $ECR/ms-ventas:1.0.0
docker push $ECR/ms-notificaciones:1.0.0
docker push $ECR/ms-reportes:1.0.0
docker push $ECR/frontend:1.0.0
```

---

## Paso 5 — Actualizar los manifiestos para apuntar a ECR

```bash
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
ECR=$AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Reemplazar el prefijo de imagen en todos los manifiestos
sed -i "s|image: restaurant/|image: $ECR/|g" k8s/backend/*.yaml
sed -i "s|image: restaurant/|image: $ECR/|g" k8s/frontend/frontend.yaml
```

---

## Paso 6 — Crear servicios gestionados de AWS

```bash
# ── RDS PostgreSQL ──────────────────────────────────────────────
# Primero necesitas un subnet group (usa las subnets del cluster EKS)
aws rds create-db-subnet-group \
  --db-subnet-group-name restaurant-subnet-group \
  --db-subnet-group-description "Subnets para RDS restaurant" \
  --subnet-ids subnet-xxxx subnet-yyyy

aws rds create-db-instance \
  --db-instance-identifier rds-restaurant-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.3 \
  --master-username postgres \
  --master-user-password "TuPasswordSegura123!" \
  --allocated-storage 20 \
  --db-subnet-group-name restaurant-subnet-group \
  --no-publicly-accessible

# Crear las 4 bases de datos (una vez que RDS esté disponible)
psql -h rds-restaurant-prod.xxxx.us-east-1.rds.amazonaws.com -U postgres -c "CREATE DATABASE db_auth;"
psql -h rds-restaurant-prod.xxxx.us-east-1.rds.amazonaws.com -U postgres -c "CREATE DATABASE db_maestros;"
psql -h rds-restaurant-prod.xxxx.us-east-1.rds.amazonaws.com -U postgres -c "CREATE DATABASE db_ventas;"
psql -h rds-restaurant-prod.xxxx.us-east-1.rds.amazonaws.com -U postgres -c "CREATE DATABASE db_sonar;"

# ── ElastiCache Redis ──────────────────────────────────────────
aws elasticache create-cache-cluster \
  --cache-cluster-id redis-restaurant-prod \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1

# ── Amazon MQ (RabbitMQ) ───────────────────────────────────────
aws mq create-broker \
  --broker-name rabbitmq-restaurant-prod \
  --engine-type RABBITMQ \
  --engine-version 3.13 \
  --host-instance-type mq.t3.micro \
  --auto-minor-version-upgrade \
  --publicly-accessible false \
  --user Username=admin,Password=AdminPass123!

# ── Secrets Manager ───────────────────────────────────────────
aws secretsmanager create-secret \
  --name restaurant/db-password \
  --secret-string "TuPasswordSegura123!"

aws secretsmanager create-secret \
  --name restaurant/jwt-secret \
  --secret-string "miClaveJwtSuperSecretaParaProduccion"
```

---

## Paso 7 — Actualizar ConfigMap y Secrets con endpoints de AWS

Editar `k8s/configmap.yaml` con los endpoints reales de AWS:

```yaml
data:
  SPRING_DATASOURCE_URL: jdbc:postgresql://rds-restaurant-prod.xxxx.us-east-1.rds.amazonaws.com:5432/db_auth
  SPRING_RABBITMQ_HOST: b-xxxx.mq.us-east-1.amazonaws.com
  SPRING_RABBITMQ_PORT: "5671"
  SPRING_RABBITMQ_SSL_ENABLED: "true"
  SPRING_DATA_REDIS_HOST: redis-restaurant-prod.xxxx.cfg.use1.cache.amazonaws.com
  SPRING_DATA_REDIS_PORT: "6379"
```

---

## Paso 8 — Desplegar en EKS

Los mismos manifiestos de Minikube/AKS funcionan igual en EKS:

```bash
# Aplicar en orden
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/infra/pvc.yaml

# Si usas RDS/ElastiCache/MQ de AWS, saltar infra interna
# kubectl apply -f k8s/infra/

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

## Pipeline CI/CD — GitHub Actions para EKS

```yaml
# .github/workflows/deploy-eks.yml
name: Build & Deploy to EKS

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  EKS_CLUSTER: eks-restaurant

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configurar credenciales AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login a Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build y Push imágenes a ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/api-gateway:$TAG \
            ./Backend/restaurant-backend \
            --file Backend/restaurant-backend/api-gateway/Dockerfile
          docker push $ECR_REGISTRY/api-gateway:$TAG

          # Repetir por cada microservicio...

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configurar credenciales AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Conectar kubectl a EKS
        run: |
          aws eks update-kubeconfig \
            --region $AWS_REGION \
            --name $EKS_CLUSTER

      - name: Actualizar imagen en el cluster
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          TAG: ${{ github.sha }}
        run: |
          kubectl set image deployment/api-gateway \
            api-gateway=$ECR_REGISTRY/api-gateway:$TAG \
            -n restaurant

          # Repetir por cada microservicio...

      - name: Verificar despliegue
        run: kubectl rollout status deployment/api-gateway -n restaurant
```

---

## Escalado automático (HPA)

Igual que en AKS, EKS soporta HPA nativo:

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

EKS también soporta **Cluster Autoscaler** — escala los nodos EC2 automáticamente si los pods no caben:

```bash
# Instalar Cluster Autoscaler
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm install cluster-autoscaler autoscaler/cluster-autoscaler \
  --set autoDiscovery.clusterName=eks-restaurant \
  --set awsRegion=us-east-1
```

---

## Estimación de costos en EKS (us-east-1)

| Servicio | Tier | Costo aprox/mes |
|---|---|---|
| EKS Control Plane | $0.10/hora fijo | ~$73 |
| EC2 Worker Nodes (2 × t3.medium) | On-demand | ~$60 |
| ALB (Application Load Balancer) | Por horas + tráfico | ~$16 |
| Amazon ECR | Por almacenamiento | ~$3 |
| Amazon RDS PostgreSQL | db.t3.micro | ~$50 |
| Amazon ElastiCache Redis | cache.t3.micro | ~$25 |
| Amazon MQ (RabbitMQ) | mq.t3.micro | ~$30 |
| AWS Secrets Manager | Por secreto | ~$1 |
| CloudWatch | Pay-as-you-go | ~$10 |
| CloudFront + WAF (opcional) | Por solicitudes | ~$20 |
| **TOTAL estimado** | | **~$288–310/mes** |

> EKS es más caro que AKS (~$240-260/mes) principalmente porque cobra $73/mes fijo
> por el plano de control, que en AKS es gratuito.
> Para reducir costos en dev/staging: usar Fargate (sin nodos EC2) o 1 nodo t3.small.

---

## Diferencias EKS vs AKS vs Minikube

| | Minikube (local) | AKS (Azure) | EKS (AWS) |
|---|---|---|---|
| Costo plano de control | Gratis | **Gratis** | **$73/mes** |
| Registry de imágenes | Build local | ACR (~$5/mes) | ECR (~$3/mes) |
| Base de datos | PVC local | Azure DB PostgreSQL | Amazon RDS |
| Cache Redis | PVC local | Azure Cache | ElastiCache |
| Mensajería | RabbitMQ en K8s | Azure Service Bus | Amazon MQ |
| Login al registry | `minikube docker-env` | `az acr login` | `aws ecr get-login-password` |
| Conectar kubectl | `minikube start` | `az aks get-credentials` | `aws eks update-kubeconfig` |
| Crear cluster | `minikube start` | `az aks create` | `eksctl create cluster` |
| Ingress IP | IP local | Azure Load Balancer | AWS ALB |
| Alta disponibilidad | No | Sí | Sí |
| Herramienta CLI extra | — | az CLI | aws CLI + eksctl |

---

## Comandos útiles en EKS

```bash
# Ver todos los pods
kubectl get pods -n restaurant

# Ver logs de un microservicio
kubectl logs -f deployment/ms-auth -n restaurant

# Escalar manualmente ms-ventas a 3 réplicas
kubectl scale deployment ms-ventas --replicas=3 -n restaurant

# Ver el ingress y su hostname del ALB
kubectl get ingress -n restaurant

# Hacer rolling update a una nueva versión
kubectl set image deployment/ms-auth \
  ms-auth=123456789.dkr.ecr.us-east-1.amazonaws.com/ms-auth-security:2.0.0 \
  -n restaurant

# Rollback si algo falla
kubectl rollout undo deployment/ms-auth -n restaurant

# Ver uso de recursos
kubectl top nodes
kubectl top pods -n restaurant

# Eliminar todo el namespace
kubectl delete namespace restaurant

# Eliminar el cluster EKS completo (¡cuidado! elimina todo)
eksctl delete cluster --name eks-restaurant --region us-east-1
```
