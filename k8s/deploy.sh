#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  Deploy Restaurant Stack en Kubernetes (Minikube)
#  Uso: bash k8s/deploy.sh          (solo backend, liviano)
#       bash k8s/deploy.sh --delete (eliminar todo)
#
#  Frontend y SonarQube comentados — pesan mucho en local
#  Para activarlos descomenta las líneas marcadas con [OPCIONAL]
# ═══════════════════════════════════════════════════════════════

set -e

DELETE=false
[[ "$1" == "--delete" ]] && DELETE=true

if $DELETE; then
  echo "Eliminando namespace restaurant..."
  kubectl delete namespace restaurant --ignore-not-found
  echo "Stack eliminado."
  exit 0
fi

echo ""
echo "================================================="
echo "  Deploy Restaurant Stack en Kubernetes"
echo "================================================="
echo ""

# 1. Verificar que Minikube esté corriendo
if ! minikube status | grep -q "Running"; then
  echo "Iniciando Minikube..."
  minikube start --memory=8192 --cpus=4
fi

# 2. Usar el registry de Minikube para las imágenes locales
eval $(minikube docker-env)

# 3. Build de imágenes Docker locales
echo "Construyendo imágenes Docker..."
docker build -t restaurant/eureka-server:1.0.0     ./Backend/restaurant-backend --file Backend/restaurant-backend/eureka-server/Dockerfile
docker build -t restaurant/config-server:1.0.0     ./Backend/restaurant-backend --file Backend/restaurant-backend/config-server/Dockerfile
docker build -t restaurant/api-gateway:1.0.0       ./Backend/restaurant-backend --file Backend/restaurant-backend/api-gateway/Dockerfile
docker build -t restaurant/ms-auth-security:1.0.0  ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-auth-security/Dockerfile
docker build -t restaurant/ms-core-maestros:1.0.0  ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-core-maestros/Dockerfile
docker build -t restaurant/ms-ventas:1.0.0         ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-ventas/Dockerfile
docker build -t restaurant/ms-notificaciones:1.0.0 ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-notificaciones/Dockerfile
docker build -t restaurant/ms-reportes:1.0.0       ./Backend/restaurant-backend --file Backend/restaurant-backend/ms-reportes/Dockerfile
# [OPCIONAL] Descomentar para incluir el frontend (tarda ~8 min en compilar Angular)
# docker build -t restaurant/frontend:1.0.0         ./Front/restaurant-frontend

echo ""
echo "Aplicando manifiestos Kubernetes..."

# 4. Namespace
kubectl apply -f k8s/namespace.yaml

# 5. Configuración base
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 6. Almacenamiento
kubectl apply -f k8s/infra/pvc.yaml

# 7. Infraestructura
kubectl apply -f k8s/infra/postgres.yaml
kubectl apply -f k8s/infra/rabbitmq.yaml
kubectl apply -f k8s/infra/redis.yaml

echo "Esperando que la base de datos esté lista..."
kubectl wait --for=condition=ready pod -l app=postgres -n restaurant --timeout=120s

# 8. Backend
kubectl apply -f k8s/backend/eureka.yaml
echo "Esperando Eureka..."
kubectl wait --for=condition=ready pod -l app=eureka-server -n restaurant --timeout=180s

kubectl apply -f k8s/backend/config-server.yaml
echo "Esperando Config Server..."
kubectl wait --for=condition=ready pod -l app=config-server -n restaurant --timeout=300s

kubectl apply -f k8s/backend/ms-auth.yaml
kubectl apply -f k8s/backend/ms-maestros.yaml
kubectl apply -f k8s/backend/ms-ventas.yaml
kubectl apply -f k8s/backend/ms-notif.yaml
kubectl apply -f k8s/backend/ms-reportes.yaml
kubectl apply -f k8s/backend/api-gateway.yaml

# 9. [OPCIONAL] Frontend — descomentar para incluir
# kubectl apply -f k8s/frontend/frontend.yaml

# 10. Monitoring
kubectl apply -f k8s/monitoring/prometheus.yaml
kubectl apply -f k8s/monitoring/grafana.yaml
# [OPCIONAL] SonarQube — pesa 2GB RAM, descomentar solo si tenés 12GB+ en Minikube
# kubectl apply -f k8s/monitoring/sonarqube.yaml

# 11. Ingress
kubectl apply -f k8s/ingress.yaml

echo ""
echo "================================================="
echo "  Stack desplegado correctamente"
echo "================================================="
echo ""
echo "Ver pods:      kubectl get pods -n restaurant"
echo "Ver servicios: kubectl get services -n restaurant"
echo ""
echo "Acceder a la API: kubectl port-forward service/api-gateway-service 8080:8080 -n restaurant"
echo ""
