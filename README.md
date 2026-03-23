# E-Commerce Microservices Backend

A full-featured e-commerce backend built with **Node.js microservices architecture**. This system includes user authentication, product catalog, shopping cart, order management, and advanced search functionality.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Microservices](#-microservices)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#️-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Mock Users](#-mock-users)
- [Docker](#-docker)
- [Project Structure](#-project-structure)
- [Authentication](#-authentication)
- [Database](#-database)
- [Deploying on GCP VM](#-deploying-on-gcp-vm)
- [Environment Variables](#-environment-variables)

---

## 🎯 Project Overview

This is a **microservices-based e-commerce backend** that demonstrates a scalable, production-ready architecture. Each service is independently deployable and handles a specific business domain.

**Key Features:**
- ✅ User authentication with JWT tokens
- ✅ Product catalog with categories and filters
- ✅ Shopping cart management
- ✅ Order management and tracking
- ✅ Advanced product search with filters
- ✅ Redis caching for performance
- ✅ MongoDB for persistent storage
- ✅ Docker containerization
- ✅ CORS enabled for cross-origin requests

---

## 💻 Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        CLIENT REQUESTS                              │
├────────────────────────────────────────────────────────────────────┤
│              API Gateway (Port 3000 - Express)                     │
│  ├─ Service Routing  ├─ Health Checks  ├─ Circuit Breaker         │
│  └─ Request Logging  └─ Retry Logic    └─ Load Balancing          │
├────────────────────────────────────────────────────────────────────┤
│                      MICROSERVICES LAYER                           │
│  User Service   │  Product Service  │  Cart Service  │  Order Svc │
│  (Port 5001)    │  (Port 5004)      │  (Port 5002)   │  (Port 5003)
│                                                                    │
│                            Search Service (Port 5005)             │
├────────────────────────────────────────────────────────────────────┤
│                    SHARED INFRASTRUCTURE                           │
│  ├─ MongoDB (5017)  ├─ Redis Cache (6379)  ├─ Shared Libraries   │
│  └─ Auth Middleware  └─ Logging            └─ Utilities           │
└────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ **Single Entry Point**: All requests go through API Gateway (port 3000)
- ✅ **Service Discovery**: Auto-detects healthy services
- ✅ **Circuit Breaker**: Fails gracefully when services are down
- ✅ **Retry Logic**: Automatic retries on transient failures
- ✅ **Health Monitoring**: Continuous service health checks
- ✅ **Request Routing**: Intelligent routing based on path patterns

---

## � API Gateway (Port 3000)

Central entry point for all microservices. Provides intelligent routing, health monitoring, and circuit breaker functionality.

**Features:**
- **Service Routing**: Routes requests to appropriate microservice based on path
- **Health Checks**: Monitors health of all services every 5 seconds
- **Circuit Breaker**: Opens circuit and returns 503 if service fails consistently
- **Retry Logic**: Automatically retries failed requests (2 retries by default)
- **Request Logging**: Logs all requests with service name and response status
- **Graceful Degradation**: Routes around unavailable services

**Endpoints:**
- `GET /` - Gateway status and available services
- `GET /gateway/status` - Detailed service health status
- All microservice APIs routed through gateway

**Example Requests (All go through port 3000):**
```bash
# Instead of: http://localhost:5001/api/auth/login
# Use: http://localhost:3000/api/auth/login

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Service Routes:**
| Path | Service | Internal Port |
|------|---------|---------------|
| `/api/auth/*` | User Service | 5001 |
| `/api/products/*` | Product Service | 5004 |
| `/api/categories/*` | Product Service | 5004 |
| `/api/cart/*` | Cart Service | 5002 |
| `/api/orders/*` | Order Service | 5003 |
| `/api/search/*` | Search Service | 5005 |

---

## 🔧 Microservices

### 1. **User Service** (Port 5001)
Handles user authentication and authorization.

**Endpoints:**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /health` - Health check

**Database:** Mock data (hardcoded users)

---

### 2. **Product Service** (Port 5004)
Manages products and categories with caching.

**Endpoints:**
- `GET /api/products` - Get all products (paginated)
- `GET /api/products/:id` - Get product by ID
- `GET /api/categories` - Get all categories
- `GET /api/categories/root` - Get root categories
- `GET /api/categories/filters-list` - Get available filters
- `GET /api/categories/filter-options` - Get filter options with counts
- `GET /api/categories/:id` - Get category by ID
- `GET /health` - Health check

**Database:** MongoDB
**Features:** Redis caching (optional), automatic seeding, pagination support

---

### 3. **Cart Service** (Port 5002)
Manages shopping carts for authenticated users.

**Endpoints:**
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/remove` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart
- `POST /api/cart/merge` - Merge cart items
- `GET /health` - Health check

**Database:** MongoDB
**Auth Required:** ✅ Yes (JWT token)

---

### 4. **Order Service** (Port 5003)
Manages customer orders and order history.

**Endpoints:**
- `GET /api/orders` - Get user's orders (paginated)
- `GET /api/orders/:id` - Get specific order
- `POST /api/orders` - Create new order
- `GET /health` - Health check

**Database:** MongoDB
**Auth Required:** ✅ Yes (JWT token)

---

### 5. **Search Service** (Port 5005)
Advanced product search with filters.

**Endpoints:**
- `GET /api/search` - Search products with filters
- `GET /health` - Health check

**Query Parameters:**
- `query` - Search term
- `page` - Page number (default: 1)
- `size` - Results per page (default: 50)
- `category`, `brands`, `priceMin`, `priceMax`, `colors`, `sizes`, `gender`, `minRating`, `sortBy`, `inStockOnly`

**Database:** MongoDB
**Features:** Advanced filtering, pagination

---

## 💻 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB 7 |
| **Cache** | Redis 7 |
| **Authentication** | JWT (JSON Web Tokens) |
| **Container** | Docker & Docker Compose |
| **API Testing** | Postman |

---

## 📦 Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js** (v16+) - optional for local development
- **Git** for version control
- **cURL** or **Postman** for API testing

---

## 🚀 Installation

### **Option 1: Docker (Recommended)**

1. **Clone the repository:**
```bash
git clone <repository-url>
cd e-commerce-app-backend
```

2. **Start all services:**
```bash
docker-compose up -d
```

3. **Verify services are running:**
```bash
docker-compose ps
```

### **Option 2: Local Development**

1. **Install dependencies for each service:**
```bash
# Install shared dependencies
cd shared && npm install && cd ..

# Install service dependencies
cd user-service && npm install && cd ..
cd product-service && npm install && cd ..
cd cart-service && npm install && cd ..
cd order-service && npm install && cd ..
cd search-service && npm install && cd ..
```

2. **Start MongoDB and Redis locally:**
```bash
# MongoDB
mongod

# Redis (in another terminal)
redis-server
```

3. **Start each microservice:**
```bash
# Terminal 1: User Service
cd user-service && npm start

# Terminal 2: Product Service
cd product-service && npm start

# Terminal 3: Cart Service
cd cart-service && npm start

# Terminal 4: Order Service
cd order-service && npm start

# Terminal 5: Search Service
cd search-service && npm start
```

---

## ▶️ Running the Application

### **Start All Services:**
```bash
docker-compose up -d
```

### **View Service Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-service
docker-compose logs -f product-service
docker-compose logs -f cart-service
docker-compose logs -f order-service
docker-compose logs -f search-service
```

### **Stop All Services:**
```bash
docker-compose down
```

### **Restart a Service:**
```bash
docker-compose restart product-service
```

---

## 🔌 API Endpoints

### **1. User Service (Port 5001)**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login user |
| POST | `/api/auth/logout` | ❌ | Logout user |
| GET | `/health` | ❌ | Health check |

**Example:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

---

### **2. Product Service (Port 5004)**

| Method | Endpoint | Auth | Description | Query Params |
|--------|----------|------|-------------|--------------|
| GET | `/api/products` | ❌ | Get all products with pagination | `page`, `pageSize` |
| GET | `/api/products/:id` | ❌ | Get product by ID | - |
| GET | `/api/categories` | ❌ | Get all categories | - |
| GET | `/api/categories/root` | ❌ | Get root categories | - |
| GET | `/api/categories/filters-list` | ❌ | Get available filters | - |
| GET | `/api/categories/filter-options` | ❌ | Get filter options | - |
| GET | `/api/categories/:id` | ❌ | Get category by ID | - |
| GET | `/health` | ❌ | Health check | - |

**GET /api/products - Query Parameters:**
- `page` - Page number (default: 1, min: 1)
- `pageSize` - Items per page (default: 10, max: 200)

**Example:**
```bash
# Get first 10 products (default)
curl http://localhost:5004/api/products

# Get products with custom pagination
curl "http://localhost:5004/api/products?page=1&pageSize=20"

# Get second page
curl "http://localhost:5004/api/products?page=2&pageSize=10"

# Get product by ID
curl http://localhost:5004/api/products/123

# Get all categories
curl http://localhost:5004/api/categories
```

**Response Example (GET /api/products):**
```json
{
  "success": true,
  "message": "Retrieved 10 of 250 products",
  "data": [
    {
      "id": 1,
      "name": "Product Name",
      "brand": "Brand",
      "category": "electronics",
      "price": 999,
      "rating": 4.5,
      "inStock": true
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalRecords": 250,
    "totalPages": 25,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### **3. Cart Service (Port 5002)**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | ✅ | Get user's cart |
| POST | `/api/cart/add` | ✅ | Add item to cart |
| POST | `/api/cart/remove` | ✅ | Remove item from cart |
| DELETE | `/api/cart/clear` | ✅ | Clear entire cart |
| POST | `/api/cart/merge` | ✅ | Merge cart items |
| GET | `/health` | ❌ | Health check |

**Example:**
```bash
# Add item to cart (requires JWT token)
curl -X POST http://localhost:5002/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "productId": "123",
    "productName": "Laptop",
    "price": 999,
    "quantity": 1
  }'
```

---

### **4. Order Service (Port 5003)**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/orders` | ✅ | Get user's orders |
| GET | `/api/orders/:id` | ✅ | Get specific order |
| POST | `/api/orders` | ✅ | Create new order |
| GET | `/health` | ❌ | Health check |

**Example:**
```bash
# Get all orders (requires JWT token)
curl http://localhost:5003/api/orders \
  -H "Authorization: Bearer JWT_TOKEN"

# Create order
curl -X POST http://localhost:5003/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "items": [{"productId": "123", "productName": "Laptop", "price": 999, "quantity": 1}],
    "totalAmount": 999,
    "shippingAddress": "123 Main St",
    "paymentMethod": "credit-card"
  }'
```

---

### **5. Search Service (Port 5005)**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/search` | ❌ | Search products |
| GET | `/health` | ❌ | Health check |

**Query Parameters:**
- `query` - Search term
- `page` - Page number (default: 1)
- `size` - Results per page (default: 50, max: 1000)
- `category`, `brands`, `priceMin`, `priceMax`, `colors`, `sizes`, `gender`, `minRating`, `sortBy`, `inStockOnly`

**Example:**
```bash
curl "http://localhost:5005/api/search?query=laptop&priceMin=500&priceMax=1500&page=1&size=20"
```

---

## 🧪 Testing

### **Test API Gateway Status (Recommended):**
```bash
# Check gateway and all service health
curl http://localhost:3000/gateway/status

# Sample output shows all 5 services with health status
```

### **Test All Health Endpoints:**
```bash
# Through API Gateway (recommended)
curl http://localhost:3000/api/auth/health
curl http://localhost:3000/api/cart/health
curl http://localhost:3000/api/orders/health
curl http://localhost:3000/api/products/health
curl http://localhost:3000/api/search/health

# Direct service health (if gateway down)
curl http://localhost:5001/health  # User Service
curl http://localhost:5002/health  # Cart Service
curl http://localhost:5003/health  # Order Service
curl http://localhost:5004/health  # Product Service
curl http://localhost:5005/health  # Search Service
```

### **Complete User Flow (Through API Gateway):**

1. **Login:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}' | jq -r '.token')

echo $TOKEN  # Verify token was received
```

2. **Get Products (with pagination):**
```bash
# Default pagination (page 1, 10 items)
curl http://localhost:3000/api/products

# Custom pagination
curl "http://localhost:3000/api/products?page=1&pageSize=20"

# Get second page
curl "http://localhost:3000/api/products?page=2&pageSize=10"

# Get all categories
curl http://localhost:3000/api/categories
```

3. **Add to Cart:**
```bash
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"productId":"1","productName":"Product","price":99,"quantity":1}'
```

4. **Create Order:**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"items":[{"productId":"1","productName":"Product","price":99,"quantity":1}],"totalAmount":99,"shippingAddress":"123 Main St","paymentMethod":"credit-card"}'
```

5. **Search Products:**
```bash
curl "http://localhost:3000/api/search?q=laptop&page=1&pageSize=10"
```

### **Using Postman:**

1. Import the Postman collection: `EcomMicroservices_NodeJS.postman_collection.json`
2. Update the base URL to your server: **`http://localhost:3000`** (or your GCP VM IP:3000)
3. All requests now route through the API Gateway for resilience and monitoring
4. Use the pre-configured requests to test all endpoints

---

## 👥 Mock Users

The system comes with predefined mock users for testing:

| Email | Password | Username |
|-------|----------|----------|
| john@example.com | password123 | John Doe |
| jane@example.com | securepass456 | Jane Smith |
| admin@example.com | admin123 | admin |

**Use these credentials to test the login endpoint.**

---

## 🐳 Docker

### **Docker Compose Configuration**

The `docker-compose.yml` file defines:

- **Services:**
  - `user-service` (Port 5001)
  - `product-service` (Port 5004)
  - `cart-service` (Port 5002)
  - `order-service` (Port 5003)
  - `search-service` (Port 5005)
  - `mongodb` (Port 27017)
  - `redis` (Port 6379)

- **Network:** `ecom-net` (bridge network)
- **volumes:** MongoDB data persistence

### **Useful Docker Commands:**

```bash
# Build services
docker-compose build

# Start in background
docker-compose up -d

# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Remove volumes (warning: deletes data)
docker-compose down -v

# Restart a service
docker-compose restart user-service
```

---

## 📁 Project Structure

```
e-commerce-app-backend/
├── shared/                          # Shared libraries & utilities
│   ├── caching/                     # Cache services (Redis, Null)
│   ├── middleware/                  # Auth and logging middleware
│   ├── models/                      # Data models (Category, Product)
│   ├── search/                      # Search engine implementations
│   └── utils/                       # Helper utilities
│
├── user-service/                    # Authentication service
│   ├── src/
│   │   ├── controllers/             # Route handlers
│   │   ├── services/                # Business logic
│   │   └── data/                    # Mock data
│   └── Dockerfile
│
├── product-service/                 # Product catalog service
│   ├── src/
│   │   ├── controllers/             # Product & category routes
│   │   ├── services/                # Product business logic
│   │   ├── repositories/            # Database access layer
│   │   └── data/                    # Database connection
│   ├── categories.json              # Category seed data
│   └── Dockerfile
│
├── cart-service/                    # Shopping cart service
│   ├── src/
│   │   ├── controllers/             # Cart routes
│   │   ├── services/                # Cart business logic
│   │   ├── repositories/            # MongoDB access
│   │   └── data/                    # Database connection
│   └── Dockerfile
│
├── order-service/                   # Order management service
│   ├── src/
│   │   ├── controllers/             # Order routes
│   │   ├── services/                # Order business logic
│   │   ├── repositories/            # Database access
│   │   ├── utils/                   # Order helpers
│   │   └── data/                    # Database connection
│   └── Dockerfile
│
├── search-service/                  # Advanced search service
│   ├── src/
│   │   ├── controllers/             # Search routes
│   │   ├── services/                # Search logic
│   │   ├── repositories/            # Database access
│   │   └── data/                    # Database connection
│   ├── products.json                # Search seed data
│   └── Dockerfile
│
├── docker-compose.yml               # Docker compose configuration
├── .gitignore                       # Git ignore file
├── EcomMicroservices_NodeJS.postman_collection.json  # Postman collection
├── package.json                     # Root package (if any)
└── README.md                        # This file
```

---

## 🔐 Authentication

- **Method:** JWT (JSON Web Tokens)
- **Header:** `Authorization: Bearer TOKEN`
- **Token Source:** Returned from `/api/auth/login`
- **Expiration:** Configurable (see auth middleware)

**Protected Endpoints:**
- Cart Service: All endpoints except `/health`
- Order Service: All endpoints except `/health`

---

## 📊 Database

### **MongoDB Collections:**

- `ecomasnmnt.carts` - Shopping carts
- `ecomasnmnt.orders` - Customer orders
- `ecomasnmnt.products` - Product catalog
- `ecomasnmnt.categories` - Product categories

### **Redis:**
- Used for caching product data (optional)
- Default connection: `localhost:6379`
- TTL: Configurable (default: 30 minutes)

---

## 🌐 Deploying on GCP VM

1. **SSH into VM:**
```bash
ssh -i ~/.ssh/google_compute_engine username@VM_EXTERNAL_IP
```

2. **Clone and navigate:**
```bash
cd ~/codebase/e-commerce-app-backend
```

3. **Start services:**
```bash
docker-compose up -d
```

4. **Test from local machine:**
```bash
curl http://VM_EXTERNAL_IP:5001/health
```

**Firewall Rules:** Ensure ports 5001-5005 are open in GCP Console.

---

## 📝 Environment Variables

Configure via `docker-compose.yml` or `.env` files:

```env
PORT=5001
NODE_ENV=production
MONGODB_CONNECTION_STRING=mongodb://mongodb:27017
MONGODB_DATABASE_NAME=ecomasnmnt
REDIS_CONNECTION_STRING=redis:6379
REDIS_ENABLED=false
AZURE_SEARCH_ENABLED=false
FORCE_RESEED=true
```

---