# Roadmap para aprender Kubernetes

> Guía personal de aprendizaje de K8s usando este proyecto como base.
> Todo el Nivel 1 y 2 se puede practicar con Minikube localmente.

---

## Nivel 1 — Básico (ya casi lo tenés)

| Tema | Dificultad | Con Minikube | Qué es |
|---|---|---|---|
| Pods, Deployments, Services | ⭐ Fácil | ✅ Sí | La base de K8s — correr contenedores |
| ConfigMap y Secrets | ⭐ Fácil | ✅ Sí | Variables de entorno y contraseñas |
| PVC (almacenamiento) | ⭐⭐ Medio | ✅ Sí | Discos persistentes para la BD |
| Ingress | ⭐⭐ Medio | ✅ Sí (con addon) | Puerta de entrada al cluster |
| kubectl profundo | ⭐ Fácil | ✅ Sí | Comandos para gestionar el cluster |

### Comandos kubectl que practicar

```bash
# Ver logs de un pod en tiempo real
kubectl logs -f deployment/ms-auth -n restaurant

# Entrar dentro de un contenedor (como SSH)
kubectl exec -it deployment/ms-auth -n restaurant -- /bin/sh

# Ver uso de CPU y RAM por pod
kubectl top pods -n restaurant

# Ver uso de CPU y RAM por nodo
kubectl top nodes

# Descripción completa de un pod (eventos, errores, config)
kubectl describe pod <nombre-pod> -n restaurant

# Ver todos los recursos de un namespace
kubectl get all -n restaurant

# Hacer un port-forward (acceder a un servicio sin Ingress)
kubectl port-forward service/ms-auth-service 8081:8081 -n restaurant
```

---

## Nivel 2 — Trabajo real

| Tema | Dificultad | Con Minikube | Qué es |
|---|---|---|---|
| Resource limits | ⭐ Fácil | ✅ Sí | Limitar CPU y RAM por pod |
| HPA (autoscaling) | ⭐⭐ Medio | ✅ Sí (con metrics-server) | Escalar pods automáticamente por carga |
| Rolling updates y Rollbacks | ⭐ Fácil | ✅ Sí | Actualizar sin cortar el servicio |
| Namespaces dev/staging/prod | ⭐ Fácil | ✅ Sí | Separar entornos en el mismo cluster |
| RBAC | ⭐⭐⭐ Difícil | ✅ Sí | Permisos — quién puede hacer qué |
| Health checks bien configurados | ⭐⭐ Medio | ✅ Sí | readinessProbe y livenessProbe |

### Resource limits — qué agregar a cada YAML

```yaml
containers:
  - name: ms-auth
    resources:
      requests:           # mínimo que necesita para arrancar
        memory: "384Mi"
        cpu: "200m"
      limits:             # máximo que puede usar
        memory: "512Mi"
        cpu: "500m"
```

```
200m CPU  = 0.2 CPUs (200 milicores)
500m CPU  = 0.5 CPUs
1000m CPU = 1 CPU completo

384Mi = 384 mebibytes de RAM
512Mi = 512 mebibytes de RAM
```

### HPA — escalar ms-ventas automáticamente

```yaml
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
          averageUtilization: 70   # si supera 70% CPU → crea más pods
```

```bash
# Activar metrics-server en Minikube (necesario para HPA)
minikube addons enable metrics-server

# Ver el HPA en acción
kubectl get hpa -n restaurant
```

### Rolling updates y Rollbacks

```bash
# Actualizar la imagen de ms-auth a una nueva versión
kubectl set image deployment/ms-auth ms-auth=restaurant/ms-auth:2.0.0 -n restaurant

# Ver el progreso del rolling update
kubectl rollout status deployment/ms-auth -n restaurant

# Ver historial de versiones
kubectl rollout history deployment/ms-auth -n restaurant

# Volver a la versión anterior si algo falla
kubectl rollout undo deployment/ms-auth -n restaurant

# Volver a una versión específica
kubectl rollout undo deployment/ms-auth --to-revision=2 -n restaurant
```

### Namespaces — separar entornos

```bash
# Crear namespaces para cada entorno
kubectl create namespace restaurant-dev
kubectl create namespace restaurant-staging
kubectl create namespace restaurant-prod

# Desplegar en dev
kubectl apply -f k8s/ -n restaurant-dev

# Ver pods de un entorno específico
kubectl get pods -n restaurant-staging
```

### RBAC — permisos básicos

```yaml
# Rol que solo puede ver pods (no modificar)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: restaurant
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]   # solo lectura
---
# Asignar el rol a un usuario
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: restaurant
subjects:
  - kind: User
    name: "junior-dev"
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

---

## Nivel 3 — Senior

| Tema | Dificultad | Con Minikube | Qué es |
|---|---|---|---|
| Helm | ⭐⭐ Medio | ✅ Sí | Gestor de paquetes para K8s |
| Operators | ⭐⭐⭐⭐ Muy difícil | ✅ Sí | Automatizar tareas complejas |
| Network Policies | ⭐⭐⭐ Difícil | ⚠️ Limitado | Firewall entre pods |
| Service Mesh (Istio) | ⭐⭐⭐⭐ Muy difícil | ⚠️ Necesita 8GB+ | Tráfico, observabilidad, mTLS |
| GitOps con ArgoCD | ⭐⭐⭐ Difícil | ✅ Sí | Deploy automático desde GitHub |
| Multi-cluster | ⭐⭐⭐⭐⭐ Experto | ❌ Necesita cloud | Gestionar múltiples clusters |

### Helm — empaquetar este proyecto

Helm convierte los 21 archivos YAML en un paquete instalable con un solo comando:

```bash
# Sin Helm (lo que hacemos ahora)
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
# ... 18 archivos más

# Con Helm
helm install restaurant ./helm/restaurant-chart
helm upgrade restaurant ./helm/restaurant-chart   # actualizar
helm rollback restaurant 1                         # volver atrás
helm uninstall restaurant                          # eliminar todo
```

### GitOps con ArgoCD

```
Sin GitOps (manual):
  hacés push a GitHub → vos manualmente corrés kubectl apply

Con GitOps (ArgoCD):
  hacés push a GitHub → ArgoCD detecta el cambio → aplica automáticamente
```

```bash
# Instalar ArgoCD en Minikube
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

---

## Lo que NO podés aprender bien en Minikube

| Tema | Por qué necesitás cloud |
|---|---|
| **Multi-cluster** | Necesitás al menos 2 clusters reales |
| **Node affinity** | Solo tenés 1 nodo, no tiene sentido practicarlo |
| **Service Mesh (Istio)** | Pesa 4GB solo — Minikube va lentísimo |
| **Auto-scaling de nodos** | Minikube no puede agregar nodos reales |
| **Alta disponibilidad real** | Necesitás múltiples nodos en zonas distintas |

---

## Ruta de aprendizaje recomendada

```
Semana 1-2:   kubectl profundo
              → practicar logs, exec, describe, top, port-forward
              → entrar dentro de los pods del proyecto

Semana 3-4:   Resource limits + Health checks
              → agregar limits a todos los YAML de este proyecto
              → ajustar initialDelaySeconds según el arranque real

Semana 5-6:   HPA + Rolling updates
              → escalar ms-ventas automáticamente por CPU
              → simular un deploy de nueva versión y rollback

Mes 2:        Namespaces + RBAC
              → crear entorno dev y staging en el mismo cluster
              → crear roles de solo lectura para un usuario

Mes 2-3:      Helm
              → convertir los k8s/ de este proyecto en un Helm chart
              → instalar/desinstalar con un comando

Mes 3-4:      GitOps con ArgoCD
              → conectar el repo de GitHub con ArgoCD
              → cada push a main despliega automáticamente

Mes 4+:       Cloud real (AKS o GKE)
              → aplicar todo lo aprendido en un cluster real
              → ver azure-aks-deployment.md o aws-eks-deployment.md
```

---

## Calculadora de RAM para tu cluster

```
Fórmula:
RAM total = (microservicios × 512MB)
          + (bases de datos × 256MB)
          + (infra liviana × 128MB)
          + SonarQube si lo usás (2,048MB)
          + 15% overhead de K8s
          + 10% colchón de seguridad

Este proyecto sin SonarQube:
  8 microservicios × 512MB  = 4,096MB
  PostgreSQL                =   256MB
  Redis                     =   128MB
  RabbitMQ                  =   256MB
  Eureka + Config × 384MB   =   768MB
  nginx frontend            =    32MB
  Prometheus + Grafana      =   512MB
  ─────────────────────────────────────
  Subtotal                  = 6,048MB
  + 15% overhead K8s        =   907MB
  + 10% colchón             =   695MB
  ─────────────────────────────────────
  MÍNIMO RECOMENDADO        = ~8GB

Minikube recomendado para este proyecto:
  minikube start --memory=8192 --cpus=4
```

---

## Comparación Spring Boot vs Quarkus en K8s

| | Spring Boot | Quarkus JVM | Quarkus Native |
|---|---|---|---|
| RAM por microservicio | 256-512MB | 100-200MB | 20-50MB |
| Tiempo de arranque | 10-90 seg | 1-3 seg | 0.01-0.1 seg |
| Tamaño imagen Docker | 200-300MB | 150-200MB | 30-50MB |
| Demanda laboral | ████████ 90% | ██ 10% | ██ 10% |
| Cuándo migrar | — | 10+ microservicios | Serverless / Lambda |

---

## Herramientas para gestionar K8s

| Herramienta | Tipo | Dificultad | Para qué |
|---|---|---|---|
| **kubectl** | Terminal | ⭐⭐ Medio | Comandos directos al cluster |
| **Lens** | App escritorio | ⭐ Fácil | Ver pods, logs, métricas visualmente |
| **K9s** | Terminal visual | ⭐⭐⭐ Difícil | Gestión rápida con teclado (nivel senior) |
| **Portainer** | Web UI | ⭐ Fácil | Docker + K8s desde el navegador |
| **ArgoCD** | Web UI | ⭐⭐⭐ Difícil | GitOps — deploy automático desde GitHub |
