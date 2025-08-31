# BullMQ Mock Application

A comprehensive demonstration application showcasing all key concepts of BullMQ, the Redis-based job queue for Node.js.

## 🚀 Features

This application demonstrates the following BullMQ concepts:

### Core Concepts
- **Queue Management** - Multiple queue types with different configurations
- **Job Processing** - Various job types with different processing strategies
- **Priority Queues** - Jobs with different priority levels
- **Delayed Jobs** - Scheduled job execution
- **Recurring Jobs** - Cron-based periodic tasks
- **Job Dependencies** - Chained job execution
- **Rate Limiting** - Controlled job processing rates
- **Concurrency Control** - Limited parallel processing
- **Job Events** - Real-time job lifecycle monitoring
- **Queue Monitoring** - Comprehensive system health tracking

### Queue Types
1. **Email Queue** - Basic email processing with retry logic
2. **Image Processing Queue** - Resource-intensive tasks with concurrency control
3. **Priority Queue** - Urgent tasks with priority-based processing
4. **Delayed Queue** - Scheduled tasks with configurable delays
5. **Recurring Queue** - Periodic tasks using cron patterns
6. **Dependency Queue** - Jobs with dependencies on other jobs
7. **Rate Limited Queue** - API calls with rate limiting

## 📋 Prerequisites

- Node.js (v14 or higher)
- Redis server running locally or remotely
- npm or yarn package manager

## 🛠️ Installation

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd practice-nodejs-concepts
   ```

2. **Start infrastructure with Docker**
   ```bash
   # Make startup script executable
   chmod +x docker-start.sh
   
   # Start Redis and monitoring tools
   ./docker-start.sh start-infra
   
   # Or using npm scripts
   npm run docker:infra
   ```

3. **Install dependencies and run application**
   ```bash
   npm install
   npm run dev
   ```

4. **Access services**
   - **BullBoard (Queue Monitoring)**: http://localhost:3001 (admin/admin123)
   - **Redis Commander**: http://localhost:8081
   - **BullMQ App**: http://localhost:3000

### Option 2: Manual Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd practice-nodejs-concepts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Redis connection**
   
   Create a `.env` file in the root directory:
   ```env
   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0

   # Application Configuration
   PORT=3000
   NODE_ENV=development

   # Queue Configuration
   MAX_CONCURRENT_JOBS=5
   REMOVE_ON_COMPLETE=100
   REMOVE_ON_FAIL=50
   ```

4. **Start Redis server**
   ```bash
   # If using Docker
   docker run -d -p 6379:6379 redis:alpine

   # Or start your local Redis server
   redis-server
   ```

## 🚀 Running the Application

### Using Docker (Recommended)

#### Start infrastructure only (for development)
```bash
./docker-start.sh start-infra
npm run dev
```

#### Start full stack (production-like)
```bash
./docker-start.sh start-full
```

#### Using npm scripts
```bash
# Start infrastructure
npm run docker:infra

# Start full stack
npm run docker:full

# Start development environment
npm run docker:dev
```

### Manual Setup

#### Start the main application
```bash
npm start
```

#### Development mode with auto-reload
```bash
npm run dev
```

#### Run test scenarios
```bash
npm run test
```

### Docker Management

#### Check service status
```bash
./docker-start.sh status-infra
./docker-start.sh status-full
```

#### View logs
```bash
./docker-start.sh logs-infra
./docker-start.sh logs-full
./docker-start.sh logs redis
```

#### Stop services
```bash
./docker-start.sh stop-infra
./docker-start.sh stop-full
```

#### Clean up
```bash
./docker-start.sh cleanup-infra
./docker-start.sh cleanup-full
```

## 📚 API Endpoints

### Health Check
- `GET /health` - Application health status

### Queue Management
- `GET /api/queues` - Get all queues status
- `GET /api/queues/:queueName` - Get specific queue status
- `POST /api/queues/:queueName/pause` - Pause a queue
- `POST /api/queues/:queueName/resume` - Resume a queue
- `DELETE /api/queues/:queueName/clean` - Clean all jobs from a queue

## 🐳 Docker Services

### Service URLs
- **BullMQ Application**: http://localhost:3000
- **BullBoard (Queue Monitoring)**: http://localhost:3001 (admin/admin123)
- **Redis Commander**: http://localhost:8081
- **Redis Server**: localhost:6379

### Docker Commands
```bash
# Test Docker setup
./test-docker.sh

# Start infrastructure
./docker-start.sh start-infra

# Start full stack
./docker-start.sh start-full

# View logs
./docker-start.sh logs-infra

# Stop services
./docker-start.sh stop-infra
```

### Job Management
- `GET /api/jobs/:queueName` - Get jobs from a queue
- `GET /api/jobs/:queueName/:jobId` - Get specific job details
- `POST /api/jobs/:queueName/:jobId/retry` - Retry a failed job
- `DELETE /api/jobs/:queueName/:jobId` - Remove a job
- `POST /api/jobs/:queueName/:jobId/promote` - Promote a delayed job
- `PATCH /api/jobs/:queueName/:jobId/progress` - Update job progress
- `GET /api/jobs/:queueName/:jobId/logs` - Get job logs
- `POST /api/jobs/:queueName/:jobId/logs` - Add log to job
- `GET /api/jobs/:queueName/:jobId/stats` - Get job statistics

### Adding Jobs
- `POST /api/queues/email/add` - Add email job
- `POST /api/queues/image-processing/add` - Add image processing job
- `POST /api/queues/priority/add` - Add priority job
- `POST /api/queues/delayed/add` - Add delayed job
- `POST /api/queues/dependency/add` - Add dependency job
- `POST /api/queues/rate-limited/add` - Add rate-limited job

### Monitoring
- `GET /api/monitor/dashboard` - Overall monitoring dashboard
- `GET /api/monitor/health` - System health summary
- `GET /api/monitor/queues` - All queue statuses
- `GET /api/monitor/performance` - Performance metrics
- `GET /api/monitor/alerts` - System alerts
- `GET /api/monitor/recurring` - Recurring jobs status
- `GET /api/monitor/events` - Queue events
- `GET /api/monitor/stats` - System statistics
- `GET /api/monitor/realtime` - Real-time metrics
- `GET /api/monitor/comparison` - Queue comparison

## 🧪 Test Scenarios

The application includes comprehensive test scenarios that demonstrate all BullMQ concepts:

### Running Tests
```bash
npm run test
```

### Test Categories
1. **Basic Queue Operations** - Simple job addition and processing
2. **Priority Queues** - Jobs with different priority levels
3. **Delayed Jobs** - Scheduled job execution
4. **Recurring Jobs** - Periodic tasks with cron patterns
5. **Job Dependencies** - Chained job execution
6. **Rate Limiting** - Controlled processing rates
7. **Concurrency Control** - Limited parallel processing
8. **Job Retries** - Failed job retry logic
9. **Job Progress** - Progress tracking and reporting
10. **Queue Events** - Real-time event monitoring
11. **Job Logging** - Detailed job logging
12. **Queue Pause/Resume** - Queue control operations
13. **Job Promotion** - Promoting delayed jobs
14. **Bulk Operations** - Adding multiple jobs at once
15. **Error Handling** - Error scenarios and recovery

## 📊 Monitoring Dashboard

The application provides a comprehensive monitoring system:

### Real-time Metrics
- Queue status (waiting, active, completed, failed, delayed)
- Job processing performance
- System health indicators
- Alert management

### Performance Tracking
- Average processing times
- Success/failure rates
- Queue backlogs
- Worker utilization

### Alert System
- Critical alerts for system issues
- Warning alerts for performance degradation
- Error alerts for job failures

## 🔧 Configuration

### Queue Configuration
```javascript
// Default job options
{
  removeOnComplete: 100,    // Keep last 100 completed jobs
  removeOnFail: 50,         // Keep last 50 failed jobs
  attempts: 3,              // Retry failed jobs 3 times
  backoff: {
    type: 'exponential',    // Exponential backoff
    delay: 2000,           // 2 seconds initial delay
  }
}
```

### Worker Configuration
```javascript
// Worker options
{
  concurrency: 5,          // Process 5 jobs simultaneously
  autorun: true,           // Start processing immediately
  connection: redisConfig  // Redis connection settings
}
```

## 🏗️ Architecture

### Project Structure
```
src/
├── index.js              # Main application entry point
├── config.js             # Configuration management
├── queues/
│   └── setup.js          # Queue initialization and management
├── workers/
│   └── setup.js          # Worker setup and job processors
├── scheduler/
│   └── setup.js          # Recurring job scheduler
├── monitor/
│   └── setup.js          # Monitoring and alerting system
├── routes/
│   ├── queue-routes.js   # Queue management API
│   ├── job-routes.js     # Job management API
│   └── monitor-routes.js # Monitoring API
└── test-scenarios.js     # Comprehensive test scenarios
```

### Key Components

1. **Queue Setup** - Manages different queue types with specific configurations
2. **Worker Setup** - Handles job processing with various strategies
3. **Scheduler** - Manages recurring jobs with cron patterns
4. **Monitor** - Tracks system health and performance
5. **API Routes** - RESTful endpoints for queue and job management
6. **Test Scenarios** - Demonstrates all BullMQ concepts

## 🎯 Use Cases

This application demonstrates real-world scenarios:

### Email Processing
- Bulk email sending with retry logic
- Priority-based email processing
- Rate limiting for email providers

### Image Processing
- Resource-intensive image operations
- Concurrency control for server resources
- Progress tracking for long-running tasks

### Scheduled Tasks
- Daily cleanup operations
- Weekly report generation
- Monthly backups

### API Rate Limiting
- External API calls with rate limits
- Controlled request processing
- Error handling and retries

## 🔍 Troubleshooting

### Common Issues

1. **Redis Connection Error**
   - Ensure Redis server is running
   - Check Redis connection settings in config
   - Verify Redis port and authentication

2. **Queue Not Processing Jobs**
   - Check if workers are running
   - Verify queue is not paused
   - Check for Redis connection issues

3. **Jobs Stuck in Queue**
   - Check worker concurrency settings
   - Verify job data format
   - Check for worker errors

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## 📈 Performance Considerations

### Best Practices
- Use appropriate concurrency levels for your use case
- Implement proper error handling and retry logic
- Monitor queue performance and adjust settings
- Use job priorities for urgent tasks
- Implement rate limiting for external services

### Scaling
- Run multiple worker instances for high throughput
- Use Redis clustering for high availability
- Implement queue partitioning for large workloads
- Monitor system resources and adjust accordingly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [BullMQ](https://github.com/taskforcesh/bullmq) - The Redis-based job queue library
- [Redis](https://redis.io/) - The in-memory data structure store
- [Express.js](https://expressjs.com/) - The web framework for Node.js

---

**Happy Queue Processing! 🚀**
