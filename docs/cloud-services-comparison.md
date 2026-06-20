# Comparación de Servicios Cloud: Azure vs AWS vs GCP

> Guía de los servicios más usados en cada proveedor, para qué sirven, ventajas y precios aproximados.
> Precios en región US East / us-east-1 / us-central1. Pueden variar según región y uso.

---

## Índice

1. [Cómputo — Máquinas Virtuales](#1-cómputo--máquinas-virtuales)
2. [Contenedores — Kubernetes](#2-contenedores--kubernetes)
3. [Contenedores — Sin Kubernetes](#3-contenedores--sin-kubernetes)
4. [Registry de Imágenes Docker](#4-registry-de-imágenes-docker)
5. [Serverless — Funciones](#5-serverless--funciones)
6. [Base de Datos Relacional (SQL)](#6-base-de-datos-relacional-sql)
7. [Base de Datos NoSQL](#7-base-de-datos-nosql)
8. [Almacenamiento de Archivos (Blob/Object Storage)](#8-almacenamiento-de-archivos-blobobject-storage)
9. [Almacenamiento de Archivos Compartidos (File Storage)](#9-almacenamiento-de-archivos-compartidos-file-storage)
10. [Cache en Memoria (Redis)](#10-cache-en-memoria-redis)
11. [Mensajería y Colas](#11-mensajería-y-colas)
12. [API Gateway](#12-api-gateway)
13. [CDN — Distribución de Contenido](#13-cdn--distribución-de-contenido)
14. [DNS](#14-dns)
15. [Load Balancer](#15-load-balancer)
16. [VPN y Red Privada](#16-vpn-y-red-privada)
17. [Identidad y Autenticación (IAM)](#17-identidad-y-autenticación-iam)
18. [Secretos y Llaves](#18-secretos-y-llaves)
19. [Monitoreo y Logs](#19-monitoreo-y-logs)
20. [CI/CD — Pipelines](#20-cicd--pipelines)
21. [Hosting Web Estático](#21-hosting-web-estático)
22. [Inteligencia Artificial y ML](#22-inteligencia-artificial-y-ml)
23. [Big Data y Analytics](#23-big-data-y-analytics)
24. [Resumen de Ventajas por Proveedor](#24-resumen-de-ventajas-por-proveedor)
25. [¿Cuál elegir?](#25-cuál-elegir)

---

## 1. Cómputo — Máquinas Virtuales

Servidores virtuales donde instalás lo que quieras (Linux, Windows, tu app, etc.).

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Virtual Machines (VM) | EC2 (Elastic Compute Cloud) | Compute Engine |
| **Unidad mínima** | Standard_B1s (1 vCPU, 1GB) | t3.nano (2 vCPU, 0.5GB) | e2-micro (2 vCPU, 1GB) |
| **Precio mínimo** | ~$7/mes | ~$4/mes | ~$5/mes (e2-micro gratis en free tier) |
| **SO disponibles** | Linux, Windows | Linux, Windows | Linux, Windows |
| **Imagen personalizada** | Azure Compute Gallery | AMI (Amazon Machine Image) | Custom Image |
| **Spot/Preemptible** | Azure Spot VMs | EC2 Spot Instances | Spot VMs |
| **Precio Spot** | Hasta 90% descuento | Hasta 90% descuento | Hasta 91% descuento |

### Ventajas por proveedor
- **Azure**: Integración nativa con Active Directory. Mejor para empresas con licencias Windows (Azure Hybrid Benefit ahorra hasta 49% en VMs Windows)
- **AWS**: Mayor variedad de tipos de instancia. EC2 lleva más años en el mercado — más documentación y comunidad
- **GCP**: Las VMs de GCP facturan por segundo (no por hora) — más barato para cargas cortas. `e2-micro` gratis permanente en free tier

---

## 2. Contenedores — Kubernetes

Kubernetes gestionado: el proveedor gestiona el plano de control, vos solo gestionás los nodos.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | AKS (Azure Kubernetes Service) | EKS (Elastic Kubernetes Service) | GKE (Google Kubernetes Engine) |
| **Costo plano de control** | **Gratis** | **$73/mes** ($0.10/hr) | **Gratis** (Standard) / $73/mes (Enterprise) |
| **Nodos (2 × 2vCPU 4GB)** | ~$60/mes (B2s) | ~$60/mes (t3.medium) | ~$50/mes (e2-medium) |
| **Autopilot/Fargate** | Azure Kubernetes Autopilot | EKS Fargate | GKE Autopilot |
| **Versión K8s actualizada** | Rápida | Media | **Más rápida** (Google creó K8s) |
| **Ingress nativo** | nginx / Azure Application Gateway | ALB Ingress | Google Cloud Load Balancer |

### Ventajas por proveedor
- **Azure AKS**: Plano de control **gratis**. Mejor integración con Azure Active Directory para RBAC. Buena opción si ya usás Azure
- **AWS EKS**: El más usado en producción por volumen de empresas. Mayor ecosistema de herramientas. Pero cobra $73/mes solo por existir
- **GCP GKE**: **El mejor K8s gestionado** — Google inventó Kubernetes. Actualizaciones más rápidas, Autopilot escala a cero y solo pagás pods corriendo. Más barato en nodos

---

## 3. Contenedores — Sin Kubernetes

Correr contenedores sin necesidad de gestionar un cluster K8s. Similar a docker-compose pero en la nube.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Azure Container Apps | AWS ECS (Elastic Container Service) | Cloud Run |
| **Concepto** | Microservicios serverless | Orquestador propio de AWS | Contenedores serverless |
| **Escala a cero** | ✅ Sí | Solo con Fargate | ✅ Sí |
| **Precio base** | Por vCPU/memoria usada | Por tarea corriendo | **Por requests** (puede ser $0) |
| **Precio mínimo** | ~$0 si no hay tráfico | ~$10/mes mínimo | **$0** si no hay requests |
| **Complejidad** | Baja | Media | **Muy baja** |
| **Docker Compose compatible** | Parcialmente | Sí (ECS Compose) | No directamente |

### Ventajas por proveedor
- **Azure Container Apps**: Buen balance entre simplicidad y features. Integración con Dapr para microservicios
- **AWS ECS**: El más parecido a docker-compose. Con Fargate no gestionás servidores. Muy usado en producción
- **GCP Cloud Run**: **El más simple y barato para APIs y microservicios**. Escala a cero automáticamente — pagás solo cuando hay requests. Ideal para proyectos con tráfico variable

---

## 4. Registry de Imágenes Docker

Donde guardás tus imágenes Docker para que los clusters puedan descargarlas.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | ACR (Azure Container Registry) | ECR (Elastic Container Registry) | Artifact Registry |
| **Precio almacenamiento** | $0.003/GB/día (~$0.10/GB/mes) | $0.10/GB/mes | $0.10/GB/mes |
| **Precio transferencia** | Gratis dentro de Azure | Gratis dentro de AWS | Gratis dentro de GCP |
| **Tier gratuito** | No | 500MB gratis/mes | **500MB gratis/mes** |
| **Geo-replicación** | ✅ Sí (Premium) | ✅ Sí | ✅ Sí |
| **Escaneo de vulnerabilidades** | ✅ Sí | ✅ Sí | ✅ Sí |

### Ventajas por proveedor
- **Azure ACR**: Integración perfecta con AKS sin configuración extra (`--attach-acr`)
- **AWS ECR**: Login más verboso (`aws ecr get-login-password | docker login`) pero muy sólido
- **GCP Artifact Registry**: Soporte para más formatos además de Docker (npm, Maven, PyPI)

---

## 5. Serverless — Funciones

Correr código sin gestionar servidores. Solo subís la función y se ejecuta cuando la llaman.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Azure Functions | AWS Lambda | Cloud Functions |
| **Lenguajes** | C#, Java, Python, JS, Go, PowerShell | Python, JS, Java, Go, Ruby, C#... | Python, JS, Java, Go, Ruby, C#... |
| **Tier gratuito** | 1M ejecuciones/mes gratis | **1M ejecuciones/mes gratis** | 2M ejecuciones/mes gratis |
| **Timeout máximo** | 10 min (Premium: ilimitado) | **15 minutos** | 60 minutos |
| **Precio por millón** | $0.20 | $0.20 | $0.40 |
| **Cold start** | Medio | Medio | **Bajo** (especialmente con Cloud Run) |
| **Trigger HTTP directo** | ✅ Sí | ✅ Sí (con API Gateway) | ✅ Sí |

### Ventajas por proveedor
- **Azure Functions**: Mejor integración con servicios Microsoft (Teams, Office 365, Power Automate)
- **AWS Lambda**: El más usado. Ecosistema enorme. Integración nativa con todos los servicios AWS
- **GCP Cloud Functions**: Más fácil de configurar. Cloud Run Gen2 es más potente y tiene mejor cold start

---

## 6. Base de Datos Relacional (SQL)

Bases de datos SQL gestionadas — el proveedor hace backups, parches y alta disponibilidad.

| | Azure | AWS | GCP |
|---|---|---|---|
| **PostgreSQL** | Azure Database for PostgreSQL | Amazon RDS for PostgreSQL / Aurora PostgreSQL | Cloud SQL for PostgreSQL |
| **MySQL** | Azure Database for MySQL | Amazon RDS for MySQL / Aurora MySQL | Cloud SQL for MySQL |
| **SQL Server** | Azure SQL Database | Amazon RDS for SQL Server | — (no tiene) |
| **Propio del proveedor** | — | **Aurora** (compatible con MySQL/PostgreSQL, hasta 5× más rápido) | **AlloyDB** (compatible con PostgreSQL, 4× más rápido) |
| **Precio mínimo PostgreSQL** | ~$25/mes (Burstable B1ms) | ~$15/mes (db.t3.micro) | ~$10/mes (db-f1-micro) |
| **Free tier** | No | No | **No**, pero db-f1-micro es barato |
| **Multi-región** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Serverless** | ✅ Azure SQL Serverless | ✅ Aurora Serverless v2 | ✅ AlloyDB Omni |

### Ventajas por proveedor
- **Azure**: Mejor para SQL Server (es de Microsoft). Azure SQL Hyperscale escala hasta 100TB
- **AWS**: **Aurora** es la opción más potente del mercado — compatible con PostgreSQL/MySQL pero hasta 5× más rápido y con escalado automático de storage. El más usado en startups grandes
- **GCP**: **AlloyDB** es muy nuevo pero muy potente. Cloud SQL tiene los precios más bajos para tier mínimo

---

## 7. Base de Datos NoSQL

| | Azure | AWS | GCP |
|---|---|---|---|
| **Clave-Valor / Documento** | Azure Cosmos DB | Amazon DynamoDB | Cloud Firestore / Datastore |
| **Columnar** | Azure Cosmos DB (Cassandra API) | Amazon Keyspaces | Cloud Bigtable |
| **Grafo** | Azure Cosmos DB (Gremlin API) | Amazon Neptune | — |
| **Precio mínimo** | ~$25/mes (provisionado) / $0 serverless con free tier | $0 free tier (25GB, 200M req/mes) | $0 free tier (1GB Firestore) |
| **Distribución global** | ✅ Nativo, multi-write | ✅ DynamoDB Global Tables | ✅ Sí |
| **Consistencia configurable** | ✅ 5 niveles | ✅ Eventual / Fuerte | ✅ Sí |

### Ventajas por proveedor
- **Azure Cosmos DB**: Multi-modelo (acepta SQL, MongoDB, Cassandra, Gremlin, Table APIs). Latencia garantizada <10ms. Caro para volúmenes grandes
- **AWS DynamoDB**: **El más usado en producción**. Free tier generoso. Escala automáticamente a cualquier volumen. Pero el modelo de datos es rígido
- **GCP Firestore**: Ideal para apps móviles y web — sincronización en tiempo real nativa. Muy fácil de usar con Firebase

---

## 8. Almacenamiento de Archivos (Blob/Object Storage)

Guardar archivos, imágenes, backups, logs — cualquier archivo sin estructura.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Azure Blob Storage | Amazon S3 | Google Cloud Storage |
| **Precio almacenamiento (standard)** | $0.018/GB/mes | $0.023/GB/mes | $0.020/GB/mes |
| **Free tier** | 5GB (12 meses) | 5GB (12 meses) | **5GB permanente** |
| **Clases de almacenamiento** | Hot / Cool / Cold / Archive | Standard / IA / Glacier | Standard / Nearline / Coldline / Archive |
| **Archive (más barato)** | $0.00099/GB/mes | $0.004/GB/mes | **$0.0012/GB/mes** |
| **Versionado** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Hosting web estático** | ✅ Sí | ✅ Sí | ✅ Sí |
| **CDN integrado** | Azure CDN | CloudFront | Cloud CDN |

### Ventajas por proveedor
- **Azure Blob**: Integración perfecta con servicios Azure. Buena para backups de VMs Azure
- **AWS S3**: **El estándar de la industria**. Inventó el concepto. Ecosistema enorme. La mayoría de herramientas son compatibles con la API de S3
- **GCP Cloud Storage**: Precios ligeramente más bajos. Free tier permanente de 5GB. API compatible con S3

---

## 9. Almacenamiento de Archivos Compartidos (File Storage)

Sistema de archivos que se puede montar en múltiples VMs al mismo tiempo (como un disco de red).

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Azure Files | Amazon EFS (Elastic File System) | Google Filestore |
| **Protocolo** | SMB / NFS | NFS | NFS |
| **Precio** | $0.06/GB/mes (standard) | $0.30/GB/mes | $0.20/GB/mes |
| **Mínimo** | Sin mínimo | Sin mínimo | **1TB mínimo (~$200/mes)** |
| **Compatible con Windows** | ✅ Sí (SMB nativo) | Limitado | No |

### Ventajas por proveedor
- **Azure Files**: **La mejor opción** para montar en Windows — soporte SMB nativo. Precio muy competitivo
- **AWS EFS**: Simple de usar con EC2 y EKS. Precio más alto pero no tiene mínimo
- **GCP Filestore**: Mínimo de 1TB hace que sea caro para proyectos pequeños

---

## 10. Cache en Memoria (Redis)

Cache en memoria para sesiones, rate limiting, datos frecuentes — evita ir a la BD en cada request.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Azure Cache for Redis | Amazon ElastiCache for Redis | Memorystore for Redis |
| **Tier mínimo** | C0 Basic (250MB) ~$16/mes | cache.t3.micro (0.5GB) ~$25/mes | Basic 1GB ~$49/mes |
| **Clustering** | ✅ Premium tier | ✅ Cluster mode | ✅ Standard tier |
| **Persistencia** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Versiones Redis** | 4, 6 | 5, 6, 7 | 6, 7 |

### Ventajas por proveedor
- **Azure Cache for Redis**: Tier C0 a $16/mes es el más barato para dev/staging. Fácil de conectar con servicios Azure
- **AWS ElastiCache**: Más opciones de instancia. También soporta Memcached además de Redis
- **GCP Memorystore**: El más caro en tier básico. Pero muy bien integrado con GKE

---

## 11. Mensajería y Colas

Comunicación asíncrona entre microservicios — un servicio envía un mensaje, otro lo procesa cuando puede.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Cola simple** | Azure Storage Queue | Amazon SQS | Cloud Tasks / Cloud Pub/Sub |
| **Pub/Sub avanzado** | Azure Service Bus | Amazon SNS + SQS | **Cloud Pub/Sub** |
| **RabbitMQ gestionado** | No tiene | **Amazon MQ** | No tiene |
| **Kafka gestionado** | Azure Event Hubs (compatible) | Amazon MSK | **Confluent Cloud** (partner) |
| **Streaming en tiempo real** | Azure Event Hubs | Amazon Kinesis | Google Pub/Sub / Dataflow |
| **Precio mínimo mensajería** | ~$10/mes (Service Bus Standard) | ~$0 (SQS paga por mensaje) | ~$0 (Pub/Sub paga por datos) |
| **Primer millón de mensajes** | Incluido en Standard | **Gratis** | **Gratis** |

### Ventajas por proveedor
- **Azure Service Bus**: Soporte para topics, sesiones, dead-letter queue. Bueno para microservicios complejos
- **AWS SQS**: **El más simple y barato**. 1 millón de mensajes/mes gratis. Integración perfecta con Lambda
- **GCP Pub/Sub**: Diseñado para escala masiva. Sin servidor que gestionar. Primer 10GB/mes gratis

---

## 12. API Gateway

Punto de entrada único para APIs — maneja autenticación, rate limiting, caching, logging.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Azure API Management | Amazon API Gateway | Cloud Endpoints / Apigee |
| **Tier gratuito** | No (Developer ~$50/mes) | 1M llamadas/mes gratis (12 meses) | Cloud Endpoints gratis hasta cierto límite |
| **Precio por millón de llamadas** | ~$3.50 (Consumption tier) | $3.50 (REST) / $1.00 (HTTP) | ~$3.00 |
| **WebSockets** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Portal de desarrolladores** | ✅ Sí (muy completo) | Limitado | ✅ Apigee (muy completo) |

### Ventajas por proveedor
- **Azure API Management**: El más completo para empresas — portal de desarrolladores, monetización, versioning de APIs. Pero caro para empezar
- **AWS API Gateway**: El más usado. Integración nativa con Lambda (arquitectura serverless). Precio competitivo
- **GCP Apigee**: El mejor para empresas grandes que necesitan gestionar muchas APIs — pero es el más caro

---

## 13. CDN — Distribución de Contenido

Red de servidores en todo el mundo que sirven tu contenido desde el servidor más cercano al usuario.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Azure Front Door / Azure CDN | Amazon CloudFront | Cloud CDN |
| **Precio por GB transferido** | $0.087/GB (primeros 10TB) | $0.085/GB (primeros 10TB) | $0.08/GB (primeros 10TB) |
| **Primer GB gratis** | No | **1TB/mes gratis** (12 meses) | No |
| **WAF incluido** | ✅ Azure Front Door | ✅ AWS WAF (pago aparte) | ✅ Cloud Armor (pago aparte) |
| **Puntos de presencia** | 192 | **450+** | 160+ |
| **Latencia media global** | Baja | **Muy baja** (más PoPs) | Baja |

### Ventajas por proveedor
- **Azure Front Door**: CDN + balanceo global + WAF en un solo servicio. Muy bueno para apps globales
- **AWS CloudFront**: **El más usado y con más PoPs**. Integración perfecta con S3 y API Gateway
- **GCP Cloud CDN**: Precios competitivos. Muy bueno si ya usás GCP. Integrado con Google's backbone network

---

## 14. DNS

Traducir dominios (tuapp.com) a IPs.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Azure DNS | Amazon Route 53 | Cloud DNS |
| **Precio por zona** | $0.50/mes/zona | $0.50/mes/zona | $0.20/mes/zona |
| **Precio por millón de queries** | $0.40 | $0.40 | $0.40 |
| **DNS Failover / Health checks** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Geolocation routing** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Registro de dominios** | No | ✅ **Sí, desde $9/año** | No |

### Ventajas por proveedor
- **Azure DNS**: Muy confiable. Integrado con Azure Traffic Manager para routing avanzado
- **AWS Route 53**: **El único que permite registrar dominios directamente**. Health checks integrados para failover automático
- **GCP Cloud DNS**: El más barato por zona. 99.99% SLA garantizado

---

## 15. Load Balancer

Distribuye el tráfico entre múltiples instancias de tu app.

| | Azure | AWS | GCP |
|---|---|---|---|
| **L7 (HTTP/HTTPS)** | Azure Application Gateway | ALB (Application Load Balancer) | Cloud Load Balancing (HTTP) |
| **L4 (TCP/UDP)** | Azure Load Balancer | NLB (Network Load Balancer) | Cloud Load Balancing (TCP) |
| **Global** | Azure Front Door | AWS Global Accelerator | Cloud Load Balancing (es global por default) |
| **Precio mínimo L7** | ~$18/mes | ~$16/mes | **~$18/mes** |
| **SSL/TLS termination** | ✅ Sí | ✅ Sí | ✅ Sí |
| **WAF integrado** | ✅ Application Gateway | Pago aparte (AWS WAF) | Pago aparte (Cloud Armor) |

### Ventajas por proveedor
- **Azure Application Gateway**: WAF incluido sin costo extra en el tier WAF_v2. Buena integración con AKS
- **AWS ALB**: **El más flexible** — routing por path, header, host. Integración perfecta con ECS y EKS
- **GCP**: Load Balancer global por defecto — el mismo balanceador sirve tráfico de todo el mundo sin configuración extra

---

## 16. VPN y Red Privada

Conectar tu oficina/datacenter con la nube de forma segura, o aislar recursos en una red privada.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Red privada virtual** | Azure Virtual Network (VNet) | Amazon VPC | Google VPC |
| **VPN Site-to-Site** | Azure VPN Gateway | AWS Site-to-Site VPN | Cloud VPN |
| **Conexión dedicada** | Azure ExpressRoute | AWS Direct Connect | Cloud Interconnect |
| **Precio VPN básica** | ~$27/mes | ~$36/mes | ~$36/mes |
| **Precio conexión dedicada** | Desde ~$55/mes | Desde ~$220/mes | Desde ~$100/mes |
| **Peering entre VPCs** | VNet Peering (gratis mismo region) | VPC Peering (~$0.01/GB) | VPC Peering (gratis mismo proyecto) |

### Ventajas por proveedor
- **Azure**: ExpressRoute tiene más proveedores de conectividad en Latinoamérica
- **AWS**: VPC es el más maduro y configurable. Direct Connect muy establecido para empresas
- **GCP**: El VPC es global por defecto (no por región como Azure/AWS) — simplifica la arquitectura multi-región

---

## 17. Identidad y Autenticación (IAM)

Controlar quién puede hacer qué en tu cuenta cloud.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Azure Active Directory (Entra ID) | AWS IAM | Cloud IAM |
| **Usuarios empresariales** | ✅ **El mejor** (directorio completo) | IAM Users (limitado) | Cloud Identity |
| **Single Sign-On** | ✅ Azure AD SSO | AWS SSO (IAM Identity Center) | Google Workspace SSO |
| **MFA** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Free tier** | 50,000 MAU gratis (B2C) | Gratis (IAM básico) | Gratis |
| **Integración con Office 365** | ✅ **Nativa** | No | No |

### Ventajas por proveedor
- **Azure AD (Entra ID)**: **El mejor para empresas** — integración nativa con Windows, Office 365, Teams. El estándar corporativo
- **AWS IAM**: Muy granular en permisos. Roles para servicios muy bien implementado. El más usado en startups tech
- **GCP**: IAM simple y limpio. Mejor si ya usás Google Workspace

---

## 18. Secretos y Llaves

Guardar contraseñas, API keys, certificados de forma segura — sin hardcodear en el código.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Azure Key Vault | AWS Secrets Manager | Secret Manager |
| **Precio por secreto/mes** | $0.03/secreto + operaciones | **$0.40/secreto/mes** | **$0.06/versión activa/mes** |
| **Precio por 10K operaciones** | $0.03 | $0.05 | $0.03 |
| **Rotación automática** | ✅ Sí | ✅ **Sí, nativa con RDS** | ✅ Sí |
| **HSM (hardware security)** | ✅ Managed HSM | ✅ CloudHSM | ✅ Cloud HSM |
| **Free tier** | No | No | **6 secretos gratis** |

### Ventajas por proveedor
- **Azure Key Vault**: Más barato por secreto. Integración perfecta con AKS y Azure Functions
- **AWS Secrets Manager**: Rotación automática de contraseñas de RDS sin código. Más caro pero muy automatizado
- **GCP Secret Manager**: Los primeros 6 secretos son gratis. Precio muy competitivo

---

## 19. Monitoreo y Logs

Ver métricas, logs y alertas de tus aplicaciones e infraestructura.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Azure Monitor + Application Insights | Amazon CloudWatch | Cloud Monitoring + Cloud Logging |
| **Logs** | Log Analytics Workspace | CloudWatch Logs | Cloud Logging |
| **Métricas** | Azure Monitor Metrics | CloudWatch Metrics | Cloud Monitoring |
| **APM (trazas de código)** | Application Insights | AWS X-Ray | Cloud Trace |
| **Dashboards** | Azure Dashboards | CloudWatch Dashboards | Cloud Monitoring Dashboards |
| **Free tier logs** | 5GB/mes | 5GB/mes ingestión | **50GB/mes** |
| **Precio por GB logs adicional** | $2.76/GB | $0.50/GB ingestión + $0.03/GB storage | $0.01/GB (sobre 50GB) |
| **Alertas** | ✅ Sí | ✅ Sí | ✅ Sí |

### Ventajas por proveedor
- **Azure Application Insights**: **El mejor APM integrado** — rastrea requests, dependencias, excepciones automáticamente en apps .NET y Java sin cambiar código
- **AWS CloudWatch**: El más usado. Integrado con todos los servicios AWS. Precio de logs muy competitivo
- **GCP**: **Free tier de 50GB de logs es enorme** — suficiente para proyectos medianos sin pagar nada

---

## 20. CI/CD — Pipelines

Automatizar build, test y deploy cuando subís código.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Azure DevOps / GitHub Actions | AWS CodePipeline + CodeBuild | Cloud Build |
| **Minutos gratis/mes** | **1,800 min** (Azure DevOps) / GitHub Actions varía | 100 min (CodeBuild free tier) | **120 min/día gratis** |
| **Precio por minuto adicional** | $0.008/min (hosted) | $0.005/min (general) | $0.003/min |
| **Integración con GitHub** | ✅ Excelente (GitHub es de Microsoft) | ✅ Sí | ✅ Sí |
| **Runners propios** | ✅ Self-hosted runners | ✅ Sí | ✅ Sí |

### Ventajas por proveedor
- **Azure DevOps / GitHub Actions**: **El mejor para equipos** — GitHub Actions es el estándar de la industria hoy. Azure DevOps tiene Boards, Repos, Pipelines, Artifacts todo integrado
- **AWS CodePipeline**: Más complejo de configurar. Mejor opción si tu infra es 100% AWS y querés todo integrado
- **GCP Cloud Build**: El más barato por minuto. Rápido y simple. Buena integración con GKE

---

## 21. Hosting Web Estático

Servir sitios web estáticos (Angular, React, HTML/CSS/JS) sin servidor.

| | Azure | AWS | GCP |
|---|---|---|---|
| **Nombre** | Azure Static Web Apps | AWS Amplify / S3 + CloudFront | Firebase Hosting |
| **Precio** | **Gratis** (Free tier permanente) | Amplify: $0.01/GB build + hosting | **Gratis** (10GB/mes) |
| **Deploy automático desde GitHub** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Preview por PR** | ✅ Sí | ✅ Sí | ✅ Sí |
| **SSL/HTTPS automático** | ✅ Sí | ✅ Sí | ✅ Sí |
| **CDN incluida** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Funciones serverless integradas** | ✅ Azure Functions | ✅ Lambda@Edge | ✅ Cloud Functions |

### Ventajas por proveedor
- **Azure Static Web Apps**: **Completamente gratis** para proyectos pequeños y medianos. Deploy automático desde GitHub con preview por PR. El más fácil para Angular/React
- **AWS Amplify**: Muy potente para apps móviles + web. Incluye autenticación, GraphQL, storage. Puede ser caro a escala
- **Firebase Hosting**: **El más fácil de usar**. Ideal para proyectos personales o startups. Integración con Firestore y Auth de Google

---

## 22. Inteligencia Artificial y ML

| | Azure | AWS | GCP |
|---|---|---|---|
| **APIs de IA listas** | Azure AI Services | Amazon Rekognition / Comprehend / Polly | Vertex AI / Cloud Vision / Natural Language |
| **OpenAI / GPT** | ✅ **Azure OpenAI Service** (acceso exclusivo a GPT-4) | Amazon Bedrock (Claude, Llama, etc.) | Vertex AI (Gemini) |
| **Entrenamiento de modelos** | Azure Machine Learning | Amazon SageMaker | **Vertex AI** |
| **Reconocimiento de imágenes** | Azure Computer Vision | Amazon Rekognition | Cloud Vision API |
| **Speech-to-Text** | Azure Speech | Amazon Transcribe | Google Speech-to-Text |
| **Traducción** | Azure Translator | Amazon Translate | Cloud Translation |
| **Búsqueda semántica** | Azure AI Search | Amazon Kendra | Vertex AI Search |

### Ventajas por proveedor
- **Azure**: **Acceso exclusivo a modelos OpenAI (GPT-4, DALL-E, Whisper)** a través de Azure OpenAI Service. La mejor opción si necesitás GPT
- **AWS**: Amazon Bedrock da acceso a Claude (Anthropic), Llama, Mistral y otros. El más flexible para múltiples modelos
- **GCP**: **El mejor para ML propio** — TPUs (hardware diseñado por Google para ML), TensorFlow nativo, Vertex AI muy maduro

---

## 23. Big Data y Analytics

| | Azure | AWS | GCP |
|---|---|---|---|
| **Data Warehouse** | Azure Synapse Analytics | Amazon Redshift | **BigQuery** |
| **Spark gestionado** | Azure HDInsight / Databricks | Amazon EMR / Databricks | Dataproc |
| **ETL / Pipelines de datos** | Azure Data Factory | AWS Glue | Cloud Dataflow |
| **BI / Reportes** | Power BI | Amazon QuickSight | Looker |
| **Precio Data Warehouse** | ~$1.20/TB query | ~$5/TB query | **$5/TB query** (1TB/mes gratis) |
| **Almacenamiento DW** | $23/TB/mes | $0.023/GB/mes | **Gratis** (10GB permanente en BigQuery) |

### Ventajas por proveedor
- **Azure Synapse**: Mejor integración con Power BI y el ecosistema Microsoft. Muy bueno para empresas que ya usan Excel/Power BI
- **AWS Redshift**: El más maduro. Redshift Serverless muy conveniente para cargas variables
- **GCP BigQuery**: **El mejor para analytics**. Serverless, escala automático, 1TB de queries gratis/mes. El estándar para data engineering moderno

---

## 24. Resumen de Ventajas por Proveedor

### Azure — Mejor para:
- Empresas con ecosistema **Microsoft** (Windows, Office 365, Active Directory)
- Apps **.NET / C#** — integración perfecta con Visual Studio y Azure DevOps
- **Kubernetes** más barato (AKS no cobra por plano de control)
- **OpenAI / GPT-4** — acceso exclusivo vía Azure OpenAI
- Empresas grandes con contratos Enterprise Agreement
- **Ventaja precio**: VMs Windows más baratas (Hybrid Benefit), AKS gratis por plano de control

### AWS — Mejor para:
- **Startups y empresas tech** — el más usado en el mundo (~33% del mercado cloud)
- Mayor **variedad de servicios** — tiene servicios que Azure/GCP no tienen
- **ECS** para quien viene de docker-compose y no quiere K8s
- Mejor **comunidad y documentación** — más Stack Overflow, más tutoriales
- **Aurora** para BD de alta performance
- **Ventaja precio**: Spot instances muy maduro, S3 más barato, SQS paga por uso real

### GCP — Mejor para:
- **Kubernetes** — Google inventó K8s, GKE es el mejor K8s gestionado
- **Big Data / Analytics** — BigQuery es el estándar, Dataflow muy potente
- **Machine Learning** — TPUs, TensorFlow, Vertex AI muy maduros
- **Startup con tráfico variable** — Cloud Run escala a cero, pagas por requests reales
- **Ventaja precio**: Cloud Run el más barato para microservicios con tráfico variable, BigQuery gratis 1TB/mes, 50GB logs gratis

---

## 25. ¿Cuál elegir?

```
¿Tu empresa usa Windows / Office 365 / Active Directory?
   └── SÍ → Azure

¿Querés el mayor ecosistema y comunidad, o venís de AWS ya?
   └── SÍ → AWS

¿Hacés mucho analytics / ML / Big Data, o usás K8s intensivamente?
   └── SÍ → GCP

¿Startup pequeña con tráfico variable y querés pagar lo mínimo?
   └── GCP Cloud Run (escala a cero) o AWS Lambda

¿Aplicación Java/Spring Boot con microservicios en K8s?
   └── Cualquiera — los manifiestos k8s/ son los mismos
   └── GCP GKE ligeramente mejor por plano de control + precio nodos
   └── Azure AKS segundo por plano de control gratis
   └── AWS EKS tercero por $73/mes extra

¿No sabés nada de cloud y querés aprender?
   └── AWS — más documentación, más tutoriales, más demandado en el mercado laboral
```

---

## Comparación de precios — Stack similar al proyecto restaurante

| Servicio | Azure | AWS | GCP |
|---|---|---|---|
| Kubernetes (plano de control) | **$0** | $73 | **$0** |
| 2 nodos 2vCPU/4GB | $60 | $60 | **$50** |
| Load Balancer | $18 | $16 | **$18** |
| Container Registry | $5 | $3 | **$3** |
| PostgreSQL (small) | $25 | $15 | **$10** |
| Redis (small) | $16 | $25 | **$49** |
| RabbitMQ/Mensajería | $10 | $30 | **$0** (Pub/Sub) |
| Secretos | $1 | $1 | **$0** (6 gratis) |
| Logs/Monitoring | $15 | $10 | **$0** (50GB gratis) |
| **TOTAL** | **~$150/mes** | **~$233/mes** | **~$130/mes** |

> Para el stack específico de este proyecto: **GCP es el más barato**, seguido de **Azure**, y **AWS el más caro** principalmente por el plano de control de EKS.
