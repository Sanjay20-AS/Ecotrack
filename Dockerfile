# Multi-stage build for Spring Boot application
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml only first
COPY backend/pom.xml .

# Download dependencies (this layer will be cached unless pom.xml changes)
RUN mvn dependency:go-offline -B -q

# Copy source code
COPY backend/src ./src

# Build the application
RUN mvn clean package -DskipTests -B -q

# Runtime stage
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy JAR from builder
COPY --from=builder /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD java -jar app.jar --version || exit 1

# Expose port
EXPOSE 8080

# Set environment for Railway
ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
