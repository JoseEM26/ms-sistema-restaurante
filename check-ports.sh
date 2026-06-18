#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  Validador de puertos — Restaurant Stack  (Mac / Linux)
#  Uso: bash check-ports.sh
#       bash check-ports.sh --auto-start    (levanta docker-compose si todo OK)
# ═══════════════════════════════════════════════════════════════════════════════

AUTO_START=false
[[ "$1" == "--auto-start" ]] && AUTO_START=true

# Puerto | Nombre del servicio
PORTS=(
  "5433:PostgreSQL (Docker)"
  "5672:RabbitMQ"
  "15672:RabbitMQ Management"
  "6379:Redis"
  "8761:Eureka Server"
  "8888:Config Server"
  "8080:API Gateway"
  "8081:ms-auth"
  "8082:ms-maestros"
  "8083:ms-ventas"
  "8084:ms-notif"
  "8085:ms-reportes"
  "4200:Frontend"
  "9090:Prometheus"
  "3001:Grafana"
  "9000:SonarQube"
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   VALIDACION DE PUERTOS — Restaurant Stack            ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""

OCCUPIED=()

for entry in "${PORTS[@]}"; do
  PORT="${entry%%:*}"
  SERVICE="${entry#*:}"

  # Detectar qué herramienta está disponible
  if command -v lsof &>/dev/null; then
    PROC=$(lsof -iTCP:"$PORT" -sTCP:LISTEN -n -P 2>/dev/null | awk 'NR==2{print $1" (PID "$2")"}')
  elif command -v ss &>/dev/null; then
    PROC=$(ss -tlnp 2>/dev/null | awk -v p=":$PORT" '$4~p{match($6,/pid=([0-9]+)/,a); print "PID "a[1]}')
  else
    PROC=$(netstat -tlnp 2>/dev/null | awk -v p=":$PORT " '$4~p{print $7}')
  fi

  if [[ -n "$PROC" ]]; then
    printf "  [%5s]  ${RED}OCUPADO${NC}   %-22s  <- %s\n" "$PORT" "$SERVICE" "$PROC"
    OCCUPIED+=("$PORT:$SERVICE")
  else
    printf "  [%5s]  ${GREEN}libre${NC}     %s\n" "$PORT" "$SERVICE"
  fi
done

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"

if [[ ${#OCCUPIED[@]} -eq 0 ]]; then
  echo -e "  ${GREEN}TODOS LOS PUERTOS ESTAN LIBRES - Puedes levantar el stack${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
  echo ""
  if $AUTO_START; then
    echo -e "  ${YELLOW}Iniciando docker-compose...${NC}"
    docker-compose up --build -d
  else
    echo -e "  ${YELLOW}Ejecuta: docker-compose up --build -d${NC}"
  fi
else
  echo -e "  ${RED}${#OCCUPIED[@]} PUERTO(S) OCUPADO(S) — Libera los puertos antes de continuar${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${YELLOW}Para liberar un puerto (Mac/Linux):${NC}"
  for entry in "${OCCUPIED[@]}"; do
    PORT="${entry%%:*}"
    if command -v lsof &>/dev/null; then
      PID=$(lsof -iTCP:"$PORT" -sTCP:LISTEN -n -P 2>/dev/null | awk 'NR==2{print $2}')
      [[ -n "$PID" ]] && echo -e "    kill -9 $PID   ${YELLOW}# libera puerto $PORT${NC}"
    fi
  done
  echo ""
  exit 1
fi
echo ""
