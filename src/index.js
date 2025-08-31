const express = require('express');
const cors = require('cors');
const chalk = require('chalk');
const config = require('../config');

// Import BullMQ components
const { setupQueues } = require('./queues/setup');
const { setupWorkers } = require('./workers/setup');
const { setupScheduler } = require('./scheduler/setup');
const { setupMonitor } = require('./monitor/setup');
const { setupBullBoard } = require('./dashboard/bull-board-setup');

// Import API routes
const queueRoutes = require('./routes/queue-routes');
const jobRoutes = require('./routes/job-routes');
const monitorRoutes = require('./routes/monitor-routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/queues', queueRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/monitor', monitorRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    bullmq: 'running'
  });
});

// Root endpoint with documentation
app.get('/', (req, res) => {
  res.json({
    message: 'BullMQ Mock Application',
    description: 'A comprehensive demonstration of BullMQ concepts',
    endpoints: {
      health: '/health',
      queues: '/api/queues',
      jobs: '/api/jobs',
      monitor: '/api/monitor'
    },
    concepts: [
      'Queue Management',
      'Job Processing',
      'Priority Queues',
      'Delayed Jobs',
      'Recurring Jobs',
      'Job Dependencies',
      'Rate Limiting',
      'Concurrency Control',
      'Job Events',
      'Queue Monitoring'
    ]
  });
});

async function startApplication() {
  try {
    console.log(chalk.blue('🚀 Starting BullMQ Mock Application...'));
    
    // Setup BullMQ components
    console.log(chalk.yellow('📦 Setting up queues...'));
    await setupQueues();
    
    console.log(chalk.yellow('👷 Setting up workers...'));
    await setupWorkers();
    
    console.log(chalk.yellow('⏰ Setting up scheduler...'));
    await setupScheduler();
    
    console.log(chalk.yellow('📊 Setting up monitor...'));
    await setupMonitor();
    
    console.log(chalk.yellow('📈 Setting up Bull Board dashboard...'));
    const bullBoardRouter = setupBullBoard();
    app.use('/admin/queues', bullBoardRouter);
    
    // Start server
    const port = config.app.port;
    app.listen(port, () => {
      console.log(chalk.green(`✅ Server running on http://localhost:${port}`));
      console.log(chalk.cyan('📚 Available endpoints:'));
      console.log(chalk.cyan(`   - Health: http://localhost:${port}/health`));
      console.log(chalk.cyan(`   - API Docs: http://localhost:${port}/`));
      console.log(chalk.cyan(`   - Queue Management: http://localhost:${port}/api/queues`));
      console.log(chalk.cyan(`   - Job Management: http://localhost:${port}/api/jobs`));
      console.log(chalk.cyan(`   - Monitor: http://localhost:${port}/api/monitor`));
      console.log(chalk.cyan(`   - Bull Board Dashboard: http://localhost:${port}/admin/queues`));
    });
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to start application:'), error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n🛑 Shutting down gracefully...'));
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(chalk.yellow('\n🛑 Shutting down gracefully...'));
  process.exit(0);
});

startApplication();
