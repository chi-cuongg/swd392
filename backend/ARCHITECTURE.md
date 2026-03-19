# Backend Architecture Refactoring

## Overview
The backend has been refactored to implement a clean **three-layer architecture**:
1. **Routes** - HTTP layer (thin, only handle routing)
2. **Controllers** - Orchestration layer (handle request/response formatting)
3. **Services** - Business logic layer (all domain logic)

## Directory Structure

```
src/
├── core/                         # Core application logic
│   ├── routes/                   # Route definitions
│   │   ├── authRoutes.js
│   │   ├── ingestRoutes.js
│   │   ├── deviceRoutes.js
│   │   ├── alertRoutes.js
│   │   ├── thresholdRoutes.js
│   │   ├── logRoutes.js
│   │   └── configRoutes.js
│   │
│   ├── controllers/              # HTTP request handlers
│   │   ├── authController.js
│   │   ├── ingestController.js
│   │   ├── deviceController.js
│   │   ├── alertController.js
│   │   ├── thresholdController.js
│   │   ├── logController.js
│   │   └── configController.js
│   │
│   ├── services/                 # Business logic
│   │   ├── authService.js
│   │   ├── ingestService.js
│   │   ├── deviceService.js
│   │   ├── alertService.js
│   │   ├── thresholdService.js
│   │   ├── logService.js
│   │   └── configService.js
│   │
│   ├── middleware/               # HTTP middleware
│   │   ├── authMiddleware.js     # JWT authentication
│   │   └── adminMiddleware.js    # Admin role check
│   │
│   └── utils/                    # Utilities
│       ├── bootstrap.js          # System initialization
│       └── prisma.js             # Database client
│
├── domains/                      # Domain-specific configurations (separate from core)
│   ├── registry.js               # Domain registry and loader
│   ├── factory/
│   │   └── config/
│   │       └── config.js         # Factory domain config
│   ├── hospital/
│   │   └── config/
│   │       └── config.js         # Hospital domain config
│   ├── farm/
│   │   └── config/
│   │       └── config.js         # Farm domain config
│   ├── traffic/
│   │   └── config/
│   │       └── config.js         # Traffic domain config
│   └── home/
│       └── config/
│           └── config.js         # Smart Home domain config
│
├── index.js                      # Main entry point
└── ARCHITECTURE.md               # This file
```

## Layer Responsibilities

### Routes Layer (`src/core/routes/`)
- **Responsibility**: Define HTTP endpoints and route to controllers
- **No business logic** - just express route definitions
- **Example**:
```javascript
router.post('/', ingestController.ingestData);
router.get('/:id', deviceController.getDeviceById);
```

### Controllers Layer (`src/core/controllers/`)
- **Responsibility**: 
  - Handle HTTP request/response formatting
  - Error handling and status code mapping
  - Call appropriate service methods
  - Format and return data to client
- **No direct database access** - all DB calls go through services
- **Example**:
```javascript
exports.register = async(req, res) => {
    try {
        const result = await authService.register(...);
        res.status(201).json(result);
    } catch (error) {
        const status = error.status || 500;
        res.status(status).json({ error: error.message });
    }
};
```

### Services Layer (`src/core/services/`)
- **Responsibility**: 
  - All business logic and data processing
  - Database operations via Prisma
  - Data validation and transformation
  - Error throwing with proper status codes
- **No HTTP concerns** - services don't know about req/res
- **Example**:
```javascript
async register(organizationId, organizationSlug, email, password, name) {
    // Validate inputs
    if ((!organizationId && !organizationSlug) || !email || !password) {
        throw { status: 400, message: '...' };
    }
    
    // Business logic
    const organization = await this.findOrganization(...);
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create(...);
    const token = jwt.sign(...);
    
    return { token, user };
}
```

## Benefits of This Architecture

1. **Separation of Concerns**
   - Routes handle HTTP only
   - Controllers handle request/response
   - Services handle business logic

2. **Testability**
   - Services can be tested independently without HTTP mocking
   - Controllers can be tested with mock services
   - Routes are thin and simple to test

3. **Reusability**
   - Services can be called from different contexts (API, CLI, webhooks)
   - Logic isn't coupled to HTTP framework

4. **Maintainability**
   - Clear structure makes it easy to find code
   - Business logic is centralized in services
   - Changes to one layer don't affect others

5. **Scalability**
   - Easy to add new features
   - Easy to refactor without breaking routes
   - Services can be extracted to separate modules later

## Service Methods Summary

### authService
- `register(organizationId, organizationSlug, email, password, name)` - Register new user
- `login(organizationId, organizationSlug, email, password)` - Login user
- `getCurrentUser(userId)` - Get current user info

### ingestService
- `ingestData(...)` - Process incoming device data
- `normalizeMetrics(domain, metrics)` - Validate and normalize metrics
- `evaluateSeverity(value, threshold)` - Evaluate alert severity
- `processMetric(...)` - Process single metric
- `createAlertIfNeeded(...)` - Create alert based on severity

### deviceService
- `getAllDevices(organizationId, domain)` - Get all devices
- `getDeviceById(deviceId)` - Get device with sensor data
- `updateDevice(deviceId, name, description)` - Update device info

### alertService
- `getAlerts(organizationId, domain, severity, ...)` - Get alerts
- `resolveAlert(alertId)` - Mark alert as resolved

### thresholdService
- `getThresholds(organizationId, domain)` - Get all thresholds
- `updateThreshold(metricId, warn, critical, ...)` - Update threshold

### logService
- `getLogs(deviceId, organizationId, domain, level, limit)` - Get sensor logs
- `getStats(organizationId)` - Get aggregated statistics

### configService
- `getMetricSchema(domain)` - Get metric schema
- `getOrganizations()` - Get all organizations
- `getVariants(organizationId)` - Get dashboard variants
- `getVariantById(domain, organizationId)` - Get variant config

## Error Handling Pattern

All services throw errors with the following structure:
```javascript
throw {
    status: 400,           // HTTP status code
    message: 'Error message',  // User-facing message
    details: { ... }       // Optional: additional error details
};
```

Controllers catch these errors and respond appropriately:
```javascript
catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Internal Server Error';
    res.status(status).json({
        error: message,
        ...(error.details && { details: error.details })
    });
}
```

## Migration Notes

- All existing functionality is preserved
- All services are singleton instances (one instance per app)
- Controllers follow consistent error handling pattern
- Routes are now thin and focused only on routing
- Database queries are now in services, not routes

## Domain Architecture

The system is organized by **domains**, each representing a different IoT use case (hospital, factory, farm, traffic, smart home). Domains are kept separate from core logic for better organization and scalability.

### Domain Structure

Domains are located at the src level alongside core:

```
src/
├── core/                  # Core application framework
├── domains/               # Domain configurations (separate from core)
│   ├── registry.js        # Main domain loader
│   ├── factory/config/config.js
│   ├── hospital/config/config.js
│   ├── farm/config/config.js
│   ├── traffic/config/config.js
│   └── home/config/config.js
└── index.js
```

### Domain Configuration File Structure

Each domain's `config.js` contains:

```javascript
module.exports = {
    id: 'factory',                              // Domain ID
    organizationId: 'org_factory',              // Default organization
    organizationName: 'Smart Factory Org',      // Organization name
    label: 'Smart Factory',                     // Display label
    description: 'Machine monitoring...',       // Description
    icon: 'Factory',                            // UI icon
    color: '#F59E0B',                           // UI color
    
    // Metric threshold configurations
    thresholds: {
        machine_temp: { warn: 70, critical: 90, unit: 'C' },
        vibration: { warn: 50, critical: 80, unit: 'Hz' }
    },
    
    // Widget definitions for dashboard
    widgets: [
        { key: 'machine_temp', label: 'Machine Temp', unit: 'C', type: 'gauge', ... },
        { key: 'vibration', label: 'Vibration', unit: 'Hz', type: 'gauge', ... }
    ],
    
    // Metric key aliases for flexibility in data ingestion
    metricAliases: {
        machineTemperature: 'machine_temp',
        'machine-temp': 'machine_temp',
        temp: 'machine_temp'
    }
};
```

### Domain Registry

The `registry.js` file loads and manages all domains:

```javascript
// Get all domains
const domains = getAllDomains();

// Get specific domain
const factory = getDomain('factory');

// Get metric keys for a domain
const keys = getMetricKeys('factory');

// Get aliases for metric normalization
const aliases = getMetricAliases('factory');
```

### Why Domains Are Separate from Core

- **Separation of Concerns**: Domain configurations are distinct from application framework
- **Scalability**: Easy to add new domains without modifying core
- **Maintainability**: Domain logic can evolve independently
- **Organization**: Clear visual hierarchy shows domains as a distinct layer

### Benefits of Domain Organization

1. **Scalability** - Easy to add new domains
2. **Maintainability** - Domain config is centralized
3. **Flexibility** - Each domain can have unique metrics and thresholds
4. **Reusability** - Domains can be reused across organizations
5. **Clarity** - Clear separation of domain-specific logic

### Adding a New Domain

To add a new domain:

1. Create folder: `src/core/domains/newdomain/config/`
2. Create `config.js` with domain configuration
3. Update `registry.js` to import the new domain
4. Rebuild metricSchema and domain utilities automatically load it

### Metric Normalization by Domain

Each domain has its own metric aliases to handle different naming conventions:

```javascript
// Factory domain handles these aliases for 'machine_temp':
machineTemperature → machine_temp
machine_temp_c → machine_temp
'machine-temp' → machine_temp
temp → machine_temp

// Hospital domain handles these for 'heart_rate':
heartRate → heart_rate
heartrate → heart_rate
```

This allows IoT devices to send data with different metric names, and the system automatically normalizes them to the canonical metric key for the domain.
