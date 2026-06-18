# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM maven:3.9.9-eclipse-temurin-23 AS builder
WORKDIR /build

COPY pom.xml .
COPY common/pom.xml           common/pom.xml
COPY eureka-server/pom.xml    eureka-server/pom.xml
COPY config-server/pom.xml    config-server/pom.xml
COPY api-gateway/pom.xml      api-gateway/pom.xml
COPY ms-auth-security/pom.xml ms-auth-security/pom.xml
COPY ms-core-maestros/pom.xml ms-core-maestros/pom.xml
COPY ms-ventas/pom.xml        ms-ventas/pom.xml
COPY ms-notificaciones/pom.xml ms-notificaciones/pom.xml
COPY ms-reportes/pom.xml      ms-reportes/pom.xml

COPY common/src common/src
RUN mvn -N install -DskipTests -q
RUN mvn -pl common install -DskipTests -q

COPY ms-core-maestros/src ms-core-maestros/src
RUN mvn -pl ms-core-maestros clean package -DskipTests -q

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:23-jre
WORKDIR /app
COPY --from=builder /build/ms-core-maestros/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
