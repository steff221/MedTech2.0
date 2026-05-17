# MedTech Oracle Database - Complete Setup Guide
## Professional Enterprise-Grade Implementation

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Oracle Cloud Free Tier Setup](#oracle-cloud-free-tier-setup)
3. [Local Docker Setup](#local-docker-setup)
4. [Database Schema Overview](#database-schema-overview)
5. [Security Best Practices](#security-best-practices)
6. [Performance Tuning](#performance-tuning)
7. [Deployment Checklist](#deployment-checklist)

---

## Prerequisites

### Required Software

- **Docker Desktop**: https://www.docker.com/products/docker-desktop
- **Docker Compose**: Included with Docker Desktop
- **Git**: https://git-scm.com
- **SQL*Plus or SQL Developer** (optional, for direct DB access): https://www.oracle.com/database/sqldeveloper/
- **Maven 3.8+**: For Spring Boot compilation
- **JDK 21+**: https://www.oracle.com/java/technologies/downloads/

### System Requirements

- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 50GB free
- **CPU**: 2 cores minimum (4 cores recommended)
- **Network**: Stable internet connection

---

## Oracle Cloud Free Tier Setup

### Step 1: Create Oracle Cloud Account

1. Visit: https://www.oracle.com/cloud/free/
2. Click **"Start for free"**
3. Choose region (closest to Macedonia):
   - **Europe (Frankfurt)** or **Europe (Amsterdam)**
4. Complete registration:
   - Email verification
   - Phone verification
   - Payment method (won't be charged for free tier)

### Step 2: Create Autonomous Database

1. **Sign in** to Oracle Cloud Console
2. Navigate to **Autonomous Database** → **Create Autonomous Database**
3. Configure:
   - **Display name**: `medtech-db`
   - **Database name**: `MEDTECH`
   - **Workload type**: Transaction Processing (OLTP)
   - **Deployment**: Shared Infrastructure (Free tier)
   - **OCPU count**: 1
   - **Storage**: 20 GB (Auto-scaling enabled)
   - **Admin password**: Create strong password (save securely)
     ```
     Example: P@ssw0rd123!MedTech2026
     ```

4. Click **Create Autonomous Database** (takes ~5-10 minutes)

### Step 3: Download Wallet

1. Once DB is **Available**, click the database name
2. Click **Database Connection**
3. Click **Download Wallet**
4. Choose **Instance Wallet** (for development)
5. Enter your database admin password
6. Extract the downloaded `.zip` file to your project:
   ```bash
   unzip Wallet_MEDTECH.zip -d ./src/main/resources/wallet/
   ```

### Step 4: Create Database Schema

1. **Download SQL*Plus**:
   ```bash
   # For macOS (using Homebrew)
   brew tap InstallHomebrew/cask
   brew install sqlplus
   
   # For Windows: Download from Oracle SQL Developer
   ```

2. **Connect to Cloud Database**:
   ```bash
   sqlplus admin/P@ssw0rd123!MedTech2026@medtech_tp
   ```

3. **Execute Schema Script**:
   ```sql
   @medtech_schema.sql
   ```

### Step 5: Configure Spring Boot for Cloud DB

**File: `application.yml`**
```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@medtech_tp?TNS_ADMIN=src/main/resources/wallet
    username: ADMIN
    password: P@ssw0rd123!MedTech2026
    driver-class-name: oracle.jdbc.OracleDriver
  jpa:
    hibernate:
      ddl-auto: validate
    database-platform: org.hibernate.dialect.OracleDialect
    properties:
      hibernate:
        jdbc:
          batch_size: 20
          fetch_size: 50
        order_inserts: true
        order_updates: true
```

---

## Local Docker Setup (Recommended for Development)

### Step 1: Install Docker Desktop

1. Download from: https://www.docker.com/products/docker-desktop
2. Install and launch Docker Desktop
3. Verify installation:
   ```bash
   docker --version
   # Output: Docker version 24.x.x, build xxxxx
   
   docker-compose --version
   # Output: Docker Compose version 2.x.x
   ```

### Step 2: Create Project Structure

```bash
mkdir -p medtech-backend
cd medtech-backend

# Create necessary directories
mkdir -p src/main/resources/database
mkdir -p docker
mkdir -p config
```

### Step 3: Create Docker Compose File

**File: `docker-compose.yml`**

```yaml
version: '3.8'

services:
  oracle-db:
    image: gvenzl/oracle-xe:21-slim
    container_name: medtech-oracle
    environment:
      ORACLE_PASSWORD: MedTech123!@#
      ORACLE_CHARACTERSET: AL32UTF8
      ORACLE_DB: MEDTECH
    ports:
      - "1521:1521"        # SQL*Net
      - "5500:5500"        # Oracle Enterprise Manager
    volumes:
      - oracle_data:/opt/oracle/oradata
      - ./src/main/resources/database/medtech_schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
    networks:
      - medtech-network
    healthcheck:
      test: ["CMD", "sqlplus", "-s", "system/MedTech123!@#@localhost:1521/XEPDB1", "as", "sysdba", "SELECT 1 FROM dual"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s
    shm_size: 1gb
    mem_limit: 2g
    cpus: 2

  # Optional: Web-based database viewer
  oracle-express-web:
    image: gvenzl/oracle-xe:21-slim
    container_name: medtech-web
    ports:
      - "8888:8888"
    environment:
      ORACLE_PASSWORD: MedTech123!@#
    depends_on:
      oracle-db:
        condition: service_healthy
    networks:
      - medtech-network

networks:
  medtech-network:
    driver: bridge

volumes:
  oracle_data:
    driver: local
```

### Step 4: Place SQL Schema Files

Copy these files to your project:

**`src/main/resources/database/medtech_schema.sql`**
- Contains complete schema (provided separately)

**`src/main/resources/database/medtech_seed_data.sql`**
- Sample Macedonian healthcare data

### Step 5: Start Docker Container

```bash
# Start all services
docker-compose up -d

# Monitor startup progress
docker-compose logs -f oracle-db

# Wait for output: "DATABASE IS READY TO USE!"
# This typically takes 60-120 seconds
```

### Step 6: Verify Database Connection

```bash
# Check if container is running
docker ps

# Connect to database
docker exec -it medtech-oracle sqlplus -s system/MedTech123!@# << EOF
SELECT COUNT(*) FROM user_tables;
EXIT;
EOF
```

Expected output: Shows number of created tables

### Step 7: Connect Spring Boot to Local Database

**File: `application-dev.yml`**

```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@localhost:1521/XEPDB1
    username: SYSTEM
    password: MedTech123!@#
    driver-class-name: oracle.jdbc.OracleDriver
  jpa:
    hibernate:
      ddl-auto: validate
    database-platform: org.hibernate.dialect.OracleDialect
    properties:
      hibernate:
        jdbc:
          batch_size: 20
          fetch_size: 50
        order_inserts: true
        order_updates: true

# Logging
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

### Step 8: Add Oracle JDBC Dependency

**File: `pom.xml`**

```xml
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc11</artifactId>
    <version>23.2.0.0</version>
</dependency>
```

### Step 9: Run Spring Boot Application

```bash
# Start with dev profile
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"

# Or in IDE, set active profile to 'dev'
```

---

## Database Schema Overview

### Core Entities

#### 1. **USERS** (Authentication & Authorization)
- Email-based authentication
- Role-based access control (PATIENT, DOCTOR, ADMIN)
- Failed login tracking
- Account lock mechanism

**Key Columns:**
- `id` (PK)
- `email` (UNIQUE)
- `password_hash` (BCrypt)
- `role` (ENUM: PATIENT, DOCTOR, ADMIN, NURSE)
- `status` (ENUM: ACTIVE, INACTIVE, SUSPENDED)

#### 2. **PATIENTS** (Patient Demographics)
- Medical history attributes
- Emergency contact information
- Insurance details
- Geographic data (for hospital discovery)

**Key Columns:**
- `id` (PK)
- `user_id` (FK → USERS, UNIQUE)
- `date_of_birth`
- `blood_type` (ENUM)
- `allergies` (CLOB)
- `chronic_conditions` (CLOB)

#### 3. **DOCTORS** (Healthcare Provider)
- Specialization tracking
- License management
- Hospital affiliation
- Availability hours

**Key Columns:**
- `id` (PK)
- `user_id` (FK → USERS, UNIQUE)
- `hospital_id` (FK → HOSPITALS)
- `license_number` (UNIQUE)
- `specialization`
- `experience_years`
- `consultation_fee`

#### 4. **HOSPITALS** (Healthcare Facilities)
- Macedonian hospital locations
- Geographic coordinates (for mapping)
- Hospital classification

**Key Columns:**
- `id` (PK)
- `name` (UNIQUE)
- `city`
- `latitude`, `longitude`
- `type` (PRIMARY, SECONDARY, TERTIARY, PRIVATE, CLINIC)

#### 5. **APPOINTMENTS** (Scheduling)
- Patient-Doctor-Hospital mapping
- Status lifecycle management
- Cancellation tracking

**Key Columns:**
- `id` (PK)
- `patient_id`, `doctor_id`, `hospital_id` (FKs)
- `appointment_date`, `appointment_time`
- `status` (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED)

#### 6. **MEDICAL_RECORDS** (Clinical Documentation)
- SOAP note structure (Subjective, Objective, Assessment, Plan)
- MKB10 diagnosis coding (ICD-10 equivalent for Macedonian healthcare)
- Vital signs tracking
- Confidentiality flags

**Key Columns:**
- `id` (PK)
- `patient_id`, `doctor_id`, `appointment_id` (FKs)
- `diagnosis`, `mkb10_code`
- `clinical_notes` (CLOB)
- `vital_signs` (JSON or VARCHAR)

#### 7. **PRESCRIPTIONS** (Medication Management)
- Dosage and frequency information
- Prescription lifecycle (ACTIVE, COMPLETED, CANCELLED)
- Refill tracking
- Pharmacy integration hooks

**Key Columns:**
- `id` (PK)
- `patient_id`, `doctor_id` (FKs)
- `medication_name`, `dosage`, `frequency`
- `start_date`, `end_date`
- `route` (ORAL, INJECTION, TOPICAL, etc.)
- `status`

#### 8. **OPERATIONS** (Surgical Procedures)
- Surgical team tracking
- Pre/intra/post-operative notes
- Implant documentation
- Complication tracking

**Key Columns:**
- `id` (PK)
- `patient_id`, `doctor_id`, `hospital_id` (FKs)
- `operation_name`, `operation_date`
- `surgical_team`, `anesthesiologist`
- `status`

#### 9. **AUDIT_LOGS** (Compliance & Security)
- Complete audit trail of all changes
- User action tracking
- Entity-level change history
- IP address and user agent logging

**Key Columns:**
- `id` (PK)
- `user_id` (FK)
- `action_type` (INSERT, UPDATE, DELETE, VIEW, LOGIN)
- `entity_type`, `entity_id`
- `old_values`, `new_values`
- `created_at`

### Indexing Strategy

**Performance Optimization Indexes:**

1. **Single-column indexes** for frequent queries:
   - `idx_users_email` (authentication)
   - `idx_users_status` (active user lookup)
   - `idx_doctors_specialization` (doctor search)
   - `idx_appointments_date` (schedule queries)

2. **Composite indexes** for multi-condition queries:
   - `idx_appointments_doctor_date` (doctor schedule)
   - `idx_appointments_patient_date` (patient history)
   - `idx_prescriptions_patient_status` (active prescriptions)

3. **Covering indexes** (include frequently selected columns):
   - Reduces table lookups
   - Speeds up OLAP queries

### Views (Simplified Data Access)

1. **vw_patient_appointments**
   - Patient appointments with doctor details
   - Used by patient portal

2. **vw_doctor_schedule**
   - Doctor's daily schedule
   - Appointment counts per day

3. **vw_patient_medical_history**
   - Patient's complete medical history
   - Chronological SOAP notes

---

## Security Best Practices

### 1. Password Security

**BCrypt Hashing** (in Spring Boot):

```java
@Configuration
public class SecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
```

**Password Requirements:**
- Minimum 12 characters
- 1 uppercase, 1 lowercase, 1 digit, 1 special character
- Example: `P@ssw0rd123!MedTech2026`

### 2. JWT Token Security

**Token Expiration:**
```yaml
jwt:
  expiration: 86400000  # 24 hours
  refresh-expiration: 604800000  # 7 days
  secret: ${JWT_SECRET}  # Use environment variable
```

### 3. Database User Privileges

**Create restricted database user:**

```sql
-- Create application user with minimal privileges
CREATE USER medtech_app IDENTIFIED BY "AppP@ss123!";

-- Grant specific table access
GRANT CREATE SESSION TO medtech_app;
GRANT SELECT, INSERT, UPDATE ON patients TO medtech_app;
GRANT SELECT, INSERT, UPDATE ON appointments TO medtech_app;
GRANT SELECT, INSERT ON prescriptions TO medtech_app;
GRANT SELECT ON doctors TO medtech_app;
GRANT SELECT ON hospitals TO medtech_app;

-- Deny dangerous operations
REVOKE DROP ANY TABLE FROM medtech_app;
REVOKE DELETE ANY TABLE FROM medtech_app;
REVOKE TRUNCATE ANY TABLE FROM medtech_app;
```

### 4. CORS Configuration

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://medtech.mk", "https://www.medtech.mk")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

### 5. SSL/TLS Encryption

```yaml
server:
  ssl:
    key-store: ${SSL_KEYSTORE_PATH}
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: medtech-cert
```

### 6. SQL Injection Prevention

**Use Spring Data JPA with named parameters:**

```java
@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    
    @Query("SELECT p FROM Patient p WHERE p.user.email = :email")
    Optional<Patient> findByEmail(@Param("email") String email);
}
```

**Never use string concatenation for SQL queries.**

---

## Performance Tuning

### 1. Connection Pooling

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### 2. Hibernate Caching

```xml
<dependency>
    <groupId>org.hibernate</groupId>
    <artifactId>hibernate-ehcache</artifactId>
    <version>5.6.0.Final</version>
</dependency>
```

**Configuration:**
```yaml
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          region:
            factory_class: org.hibernate.cache.jcache.JCacheRegionFactory
```

### 3. Query Optimization

**Batch Processing:**
```java
@Transactional
public void insertAppointments(List<Appointment> appointments) {
    int batchSize = 20;
    for (int i = 0; i < appointments.size(); i++) {
        entityManager.persist(appointments.get(i));
        if ((i + 1) % batchSize == 0) {
            entityManager.flush();
            entityManager.clear();
        }
    }
}
```

### 4. Index Maintenance

```sql
-- Analyze table statistics
BEGIN
  DBMS_STATS.GATHER_TABLE_STATS('SYSTEM', 'APPOINTMENTS');
  DBMS_STATS.GATHER_TABLE_STATS('SYSTEM', 'MEDICAL_RECORDS');
END;
/

-- Rebuild fragmented indexes
ALTER INDEX idx_appointments_patient_id REBUILD;
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All unit tests passing
- [ ] Integration tests with real DB passing
- [ ] Code review completed
- [ ] Security scan passed (OWASP)
- [ ] Performance testing completed
- [ ] Backup strategy documented
- [ ] Disaster recovery plan tested

### Database Deployment

- [ ] Schema created and validated
- [ ] Indexes created and verified
- [ ] Audit triggers enabled
- [ ] Sample data loaded
- [ ] Connection pooling configured
- [ ] Backup scheduled
- [ ] Monitoring alerts set up

### Application Deployment

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] CORS whitelist updated
- [ ] Database credentials secured (Vault/Secrets Manager)
- [ ] Logging configured (ELK Stack recommended)
- [ ] API documentation updated
- [ ] Health check endpoints working

### Post-Deployment

- [ ] Monitor CPU, memory, disk usage
- [ ] Review application logs for errors
- [ ] Verify all API endpoints responding
- [ ] Test critical business flows
- [ ] Confirm audit logging working
- [ ] Schedule regular backups
- [ ] Document any issues and resolutions

---

## Troubleshooting

### Docker Issues

**Problem: Container won't start**
```bash
# Check logs
docker-compose logs oracle-db

# Ensure port 1521 is not in use
lsof -i :1521

# Remove and restart
docker-compose down -v
docker-compose up -d
```

**Problem: "Out of memory"**
```bash
# Increase Docker memory limit
# Docker Desktop → Preferences → Resources → Memory: 4GB+
```

### Database Connection Issues

**Problem: "ORA-12514 TNS:listener does not currently know of service"**
```bash
# Wait for database to fully start (120+ seconds)
docker-compose logs oracle-db | grep "DATABASE IS READY"
```

**Problem: "java.sql.SQLException: IO Exception: Connection refused"**
```yaml
# Check connection string in application.yml
spring.datasource.url: jdbc:oracle:thin:@localhost:1521/XEPDB1
```

---

## Support & Resources

- **Oracle Documentation**: https://docs.oracle.com
- **Spring Boot Oracle Guide**: https://spring.io/guides/gs/accessing-data-jpa/
- **Docker Oracle Image**: https://github.com/gvenzl/oci-oracle-xe
- **Macedonian Healthcare Standards**: Contact Ministry of Health

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-16 | Initial release |

---

**Last Updated:** May 16, 2026  
**Maintained By:** MedTech Development Team  
**Status:** Production Ready
