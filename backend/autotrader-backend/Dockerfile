FROM eclipse-temurin:21-jdk AS build

# Set the working directory in the container
WORKDIR /app

# Copy gradle configuration files
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Give execution permission to gradlew
RUN chmod +x ./gradlew

# Copy the source code
COPY src src

# Build the application with --no-daemon to avoid issues with the Gradle daemon
RUN ./gradlew build -x test --no-daemon

# Second stage: Runtime
FROM eclipse-temurin:21-jre-slim

# Add a non-root user to run the app
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Set the working directory
WORKDIR /app

# Copy the built artifact from the build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Create directory for uploading files with proper permissions
RUN mkdir -p /app/uploads && \
    chown -R appuser:appgroup /app/uploads

# Switch to non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 8080

# Set health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Start the application
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
