# Docker Deployment Guide - BHHV Project

## Tổng quan

Hướng dẫn này mô tả cách deploy project BHHV sử dụng Docker containers. Deployment bao gồm Next.js application và MongoDB database chạy trong các containers riêng biệt.

## Yêu cầu hệ thống

- Docker Engine 20.10 trở lên
- Docker Compose 2.0 trở lên
- RAM: Tối thiểu 2GB
- Disk: Tối thiểu 5GB trống
- Network: Port 3000 và 27018 available

## Cấu trúc Deployment

```
bhhv_v3/
├── Dockerfile              # Multi-stage build cho Next.js app
├── docker-compose.yml      # Container orchestration
├── deploy.sh              # Automated deployment script
├── .env.docker            # Environment variables
├── scripts/
│   └── migrate.js         # Database migration script
└── next.config.ts         # Next.js standalone config
```

## Quick Start

### 1. Deploy nhanh
```bash
# Clone project và chạy deploy script
./deploy.sh start
```

### 2. Kiểm tra trạng thái
```bash
# Xem containers đang chạy
./deploy.sh status

# Xem logs
./deploy.sh logs

# Health check
./deploy.sh health
```

### 3. Dừng application
```bash
./deploy.sh stop
```

## Chi tiết các Components

### 1. Docker Configuration

#### Dockerfile
- **Multi-stage build** để optimize image size
- **Node 18 Alpine** base image (lightweight)
- **Standalone output** từ Next.js để self-contained
- **Non-root user** để security tốt hơn
- **Port 3000** exposed

#### docker-compose.yml
```yaml
services:
  mongodb:
    - Port: 27018 (external) → 27017 (internal)
    - Credentials: dev/dev123
    - Database: bhhv
    - Persistent volume: mongodb_data

  app:
    - Port: 3000
    - Depends on: mongodb
    - Environment: production
    - Auto restart enabled
```

### 2. Environment Configuration

#### .env.docker
Chứa production environment variables:
- Database connection string
- JWT secrets (cần thay đổi trong production thực)
- Application URLs
- Upload settings

⚠️ **Security Note**: Trong production thực, cần update JWT secrets và các sensitive values.

### 3. Database Migration

#### scripts/migrate.js
- **Connection management**: Tự động kết nối MongoDB
- **Index creation**: Tạo indexes cho performance
- **Initial data seeding**: Setup dữ liệu ban đầu
- **Migration tasks**: Update existing data
- **Validation**: Kiểm tra database state

Chạy migration thủ công:
```bash
./deploy.sh migrate
```

### 4. Deployment Script

#### deploy.sh
Script tự động hóa toàn bộ quá trình deploy:

```bash
# Available commands
./deploy.sh start      # Build và start app
./deploy.sh stop       # Dừng app
./deploy.sh restart    # Restart app
./deploy.sh build      # Build images only
./deploy.sh migrate    # Run migration only
./deploy.sh logs       # Xem logs
./deploy.sh status     # Container status
./deploy.sh cleanup    # Clean Docker resources
./deploy.sh health     # Health check
```

## Deployment Process

### 1. Pre-deployment Checks
- ✅ Docker và Docker Compose installed
- ✅ Required files tồn tại
- ✅ Port 3000 và 27018 available

### 2. Build Process
- Build Next.js application với Turbopack
- Create Docker image với standalone output
- Optimize layers để giảm image size

### 3. Database Setup
- Start MongoDB container
- Wait for database ready
- Run migration script
- Create indexes và seed data

### 4. Application Launch
- Start app container
- Health check services
- Display access information

## Production Deployment

### 1. Security Considerations
```bash
# Update JWT secrets trong .env.docker
JWT_SECRET=your-production-secret-key
JWT_REFRESH_SECRET=your-production-refresh-key

# Sử dụng production database
MONGODB_URI=mongodb://prod_user:prod_pass@prod_host:27017/bhhv_prod
```

### 2. Performance Tuning
```yaml
# docker-compose.yml - thêm resource limits
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

### 3. Monitoring Setup
```bash
# Xem logs real-time
docker-compose logs -f app

# Monitor resource usage
docker stats bhhv_app bhhv_mongodb
```

## Troubleshooting

### Common Issues

#### 1. Container không start
```bash
# Check logs
./deploy.sh logs

# Check Docker daemon
sudo systemctl status docker
```

#### 2. Database connection failed
```bash
# Verify MongoDB container
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Test connection
docker-compose exec app node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected'))
  .catch(err => console.error(err));
"
```

#### 3. Port conflicts
```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :27018

# Update ports trong docker-compose.yml nếu cần
```

#### 4. Build failures
```bash
# Clean rebuild
./deploy.sh cleanup
./deploy.sh build

# Check Dockerfile syntax
docker build --no-cache -t bhhv-test .
```

### Health Check Commands
```bash
# Application health
curl -f http://localhost:3000/api/health

# Database health
docker-compose exec mongodb mongosh --eval "db.adminCommand('ismaster')"

# Container resources
docker system df
docker system prune -f  # cleanup unused resources
```

## Maintenance

### Regular Tasks
```bash
# Weekly cleanup
./deploy.sh cleanup

# Update application
git pull
./deploy.sh restart

# Backup database
docker-compose exec mongodb mongodump --out /data/backup
docker cp bhhv_mongodb:/data/backup ./backup_$(date +%Y%m%d)
```

### Scaling Considerations
- Sử dụng Docker Swarm hoặc Kubernetes cho multi-node
- Setup load balancer cho multiple app instances
- Sử dụng MongoDB replica set cho high availability

## Support

Khi gặp vấn đề:
1. Check logs: `./deploy.sh logs`
2. Run health check: `./deploy.sh health`
3. Review troubleshooting section
4. Check Docker và system resources