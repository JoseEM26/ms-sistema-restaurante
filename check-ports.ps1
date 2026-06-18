# ===============================================================
#  Validador de puertos - Restaurant Stack
#  Uso: .\check-ports.ps1
#       .\check-ports.ps1 -AutoStart    (levanta docker-compose si todo OK)
# ===============================================================
param([switch]$AutoStart)

$ports = @(
    [PSCustomObject]@{ Port = 5433;  Service = "PostgreSQL (Docker)"  },
    [PSCustomObject]@{ Port = 5672;  Service = "RabbitMQ"            },
    [PSCustomObject]@{ Port = 15672; Service = "RabbitMQ Management" },
    [PSCustomObject]@{ Port = 6379;  Service = "Redis"               },
    [PSCustomObject]@{ Port = 8761;  Service = "Eureka Server"       },
    [PSCustomObject]@{ Port = 8888;  Service = "Config Server"       },
    [PSCustomObject]@{ Port = 8080;  Service = "API Gateway"         },
    [PSCustomObject]@{ Port = 8081;  Service = "ms-auth"             },
    [PSCustomObject]@{ Port = 8082;  Service = "ms-maestros"         },
    [PSCustomObject]@{ Port = 8083;  Service = "ms-ventas"           },
    [PSCustomObject]@{ Port = 8084;  Service = "ms-notif"            },
    [PSCustomObject]@{ Port = 8085;  Service = "ms-reportes"         },
    [PSCustomObject]@{ Port = 4200;  Service = "Frontend"            },
    [PSCustomObject]@{ Port = 9090;  Service = "Prometheus"          },
    [PSCustomObject]@{ Port = 3001;  Service = "Grafana"             },
    [PSCustomObject]@{ Port = 9000;  Service = "SonarQube"           }
)

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  VALIDACION DE PUERTOS - Restaurant Stack             " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

$occupied = @()

foreach ($entry in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $entry.Port -State Listen -ErrorAction SilentlyContinue

    $portStr    = ("[" + $entry.Port + "]").PadRight(8)
    $serviceStr = $entry.Service.PadRight(24)

    if ($conn) {
        $pid_  = $conn[0].OwningProcess
        $proc  = Get-Process -Id $pid_ -ErrorAction SilentlyContinue
        $pname = if ($proc) { $proc.ProcessName } else { "PID $pid_" }

        Write-Host ("  $portStr  OCUPADO   $serviceStr <- $pname") -ForegroundColor Red
        $occupied += $entry
    }
    else {
        Write-Host ("  $portStr  libre     $serviceStr") -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan

if ($occupied.Count -eq 0) {
    Write-Host "  TODOS LOS PUERTOS ESTAN LIBRES - Puedes levantar el stack" -ForegroundColor Green
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host ""
    if ($AutoStart) {
        Write-Host "  Iniciando docker-compose..." -ForegroundColor Yellow
        & docker-compose up --build -d
    }
    else {
        Write-Host "  Ejecuta: docker-compose up --build -d" -ForegroundColor Yellow
    }
}
else {
    $n = $occupied.Count
    Write-Host "  $n PUERTO(S) OCUPADO(S) - Libera los puertos antes de continuar" -ForegroundColor Red
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Para matar el proceso que ocupa cada puerto:" -ForegroundColor Yellow
    foreach ($e in $occupied) {
        $conn = Get-NetTCPConnection -LocalPort $e.Port -State Listen -ErrorAction SilentlyContinue
        if ($conn) {
            $pidStr = $conn[0].OwningProcess
            Write-Host ("    Stop-Process -Id $pidStr -Force   # libera puerto " + $e.Port) -ForegroundColor DarkYellow
        }
    }
    Write-Host ""
    exit 1
}
Write-Host ""
