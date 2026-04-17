# Multi-stage optimized build for faster Render deployment
# Stage 1: Maven builder with caching
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy only pom.xml first (cache this layer)
COPY backend/pom.xml .

# Download dependencies (cached if pom.xml hasn't changed)
RUN mvn dependency:go-offline -B -q -Dmaven.artifact.threads=20

# Copy source code
COPY backend/src ./src

# Build JAR (without tests)
RUN mvn package -DskipTests -B -q -Dmaven.compiler.fork=false

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy JAR from builder
COPY --from=builder /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Create non-root user
RUN adduser -D -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Environment
ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8080

# Run
ENTRYPOINT ["java", "-jar", "app.jar"]
