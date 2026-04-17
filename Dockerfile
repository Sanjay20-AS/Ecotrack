# Use pre-built JAR - no compilation needed
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy pre-built JAR
COPY backend/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8080

ENTRYPOINT ["java", "-jar", "app.jar"]
