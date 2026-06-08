# 🔐 Seguridad — JWT y Autenticación

## Flujo completo de autenticación

```
1. Usuario → POST /api/auth/login {username, password}
                   │
                   ▼
2. ms-auth-security busca el usuario en db_auth
                   │
                   ▼
3. BCrypt verifica la contraseña
   (compara el input con el hash guardado)
                   │
                   ▼
4. Genera JWT con {sub: "admin", rol: "ADMIN", exp: +24h}
                   │
                   ▼
5. Devuelve {token: "eyJ...", username: "admin", rol: "ADMIN"}
                   │
                   ▼
6. Frontend guarda el token (cifrado con crypto-js en localStorage)
                   │
                   ▼
7. Siguiente petición: Authorization: Bearer eyJhbGci...
                   │
                   ▼
8. API Gateway valida la firma del JWT (sin consultar BD)
                   │
            ┌──────┴───────┐
          Válido         Inválido
            │               │
            ▼               ▼
      Pasa al          401 Unauthorized
      microservicio
```

---

## ¿Cómo funciona JWT?

Un JWT tiene tres partes separadas por puntos:

```
eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInJvbCI6IkFETUlOIiwiaWF0IjoxNjk...
│─────────────────── │──────────────────────────────────────────────────────────
      Header                    Payload                    Signature
```

**Header** (decodificado):
```json
{ "alg": "HS384" }
```

**Payload** (decodificado):
```json
{
  "sub": "admin",
  "rol": "ADMIN",
  "iat": 1704067200,    ← Issued At (cuándo se generó)
  "exp": 1704153600     ← Expiration (cuándo expira: +24h)
}
```

**Signature:**
```
HMAC-SHA384(base64(header) + "." + base64(payload), secret_key)
```

Si alguien modifica el payload (por ejemplo, cambia el rol a ADMIN), la firma ya no coincide y el Gateway rechaza el token.

---

## BCrypt — Almacenamiento seguro de contraseñas

BCrypt es una función de hash diseñada específicamente para contraseñas:

```java
// Al registrar: BCrypt genera un hash diferente cada vez
String hash = new BCryptPasswordEncoder().encode("admin123");
// Ejemplo: $2a$10$92IXUNpkjO0rOQ5byMi...

// Al hacer login: BCrypt verifica sin necesitar el hash original
boolean matches = passwordEncoder.matches("admin123", hashGuardado);
```

**¿Por qué BCrypt y no MD5 o SHA-256?**
- BCrypt es intencionalmente lento (cost factor 10 = ~100ms por hash)
- Esto hace que los ataques de fuerza bruta sean impracticables
- Cada hash incluye un "salt" aleatorio, por lo que la misma contraseña da hashes diferentes
- MD5 y SHA-256 son demasiado rápidos para contraseñas (millones de hashes por segundo)

---

## Roles y permisos

| Rol | Dashboard | Pedidos | Mesas | Productos | Usuarios |
|---|---|---|---|---|---|
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| CAJERO | ✅ | ✅ | ✅ | 👁️ | ❌ |
| MESERO | ✅ | ✅ | 👁️ | 👁️ | ❌ |
| COCINERO | ✅ | 👁️ | ❌ | ❌ | ❌ |

(✅ = total, 👁️ = solo lectura, ❌ = sin acceso)

---

## Spring Security en ms-auth-security

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(AbstractHttpConfigurer::disable)        // API REST, no necesita CSRF
        .sessionManagement(s ->
            s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))  // Sin sesiones (JWT)
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**",           // Rutas públicas
                             "/actuator/**",
                             "/v3/api-docs/**",
                             "/swagger-ui/**").permitAll()
            .anyRequest().authenticated()              // Todo lo demás requiere auth
        )
        .build();
}
```

---

## JwtAuthFilter en el API Gateway

```java
@Component
public class JwtAuthFilter extends AbstractGatewayFilterFactory<Config> {
    private final JwtUtil jwtUtil;

    // Un constructor = Spring inyecta correctamente
    public JwtAuthFilter(JwtUtil jwtUtil) {
        super(Config.class);
        this.jwtUtil = jwtUtil;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String header = exchange.getRequest().getHeaders()
                                    .getFirst(HttpHeaders.AUTHORIZATION);

            // Sin header → 401
            if (header == null || !header.startsWith("Bearer ")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // Token inválido o expirado → 401
            if (!jwtUtil.isTokenValid(header.substring(7))) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // OK → pasa al microservicio
            return chain.filter(exchange);
        };
    }
}
```

---

## CORS — Cross-Origin Resource Sharing

El navegador bloquea peticiones desde `localhost:4200` al gateway en `localhost:8080` por estar en diferentes puertos (diferente "origen").

La configuración CORS en el Gateway permite estas peticiones:

```yaml
spring:
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins:
              - "http://localhost:4200"
            allowedMethods: [GET, POST, PUT, PATCH, DELETE, OPTIONS]
            allowedHeaders: "*"
            allowCredentials: true
```

Sin esto, el frontend vería el error:
```
Access to XMLHttpRequest ... has been blocked by CORS policy
```
