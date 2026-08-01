# ===== Stage 1: Build with Maven + JDK 21 =====
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml trước để cache dependencies (tăng tốc build lần sau)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source và build jar
COPY src ./src
RUN mvn package -DskipTests -B

# ===== Stage 2: Runtime with JRE 21 (image nhẹ) =====
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy jar từ stage build
COPY --from=build /app/target/expense-tracker-backend-0.0.1-SNAPSHOT.jar app.jar

# Render free tier dùng PORT env; mặc định 8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
