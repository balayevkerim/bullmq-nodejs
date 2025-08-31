const { Worker, JobScheduler } = require('bullmq');
const config = require('../../config');
const chalk = require('chalk');
const { getQueues } = require('../queues/setup');

// Worker instances
let emailWorker;
let imageProcessingWorker;
let priorityWorker;
let delayedWorker;
let recurringWorker;
let dependencyWorker;
let rateLimitedWorker;

// Queue schedulers for rate limiting
let rateLimitScheduler;

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
};

async function setupWorkers() {
  try {
    console.log(chalk.blue('👷 Setting up BullMQ workers...'));

    const queues = getQueues();

    // 1. Email Worker with retry logic
    emailWorker = new Worker('email-queue', async (job) => {
      console.log(chalk.cyan(`📧 Processing email job ${job.id}`));
      
      // Simulate email processing
      await simulateWork(2000);
      
      // Simulate occasional failures
      if (Math.random() < 0.1) {
        throw new Error('Email service temporarily unavailable');
      }
      
      return {
        status: 'sent',
        recipient: job.data.recipient,
        subject: job.data.subject,
        timestamp: new Date().toISOString(),
      };
    }, {
      connection,
      concurrency: 3,
      autorun: true,
    });

    // 2. Image Processing Worker with concurrency control
    imageProcessingWorker = new Worker('image-processing-queue', async (job) => {
      console.log(chalk.cyan(`🖼️ Processing image job ${job.id}`));
      
      const { imageUrl, operations } = job.data;
      
      // Simulate image processing
      await simulateWork(5000);
      
      // Simulate different processing operations
      const processedImage = {
        originalUrl: imageUrl,
        processedUrl: `processed_${imageUrl}`,
        operations: operations || ['resize', 'compress'],
        metadata: {
          width: 800,
          height: 600,
          size: '2.3MB',
          format: 'JPEG',
        },
      };
      
      return processedImage;
    }, {
      connection,
      concurrency: 2, // Limited concurrency for resource-intensive tasks
      autorun: true,
    });

    // 3. Priority Worker
    priorityWorker = new Worker('priority-queue', async (job) => {
      console.log(chalk.cyan(`⚡ Processing priority job ${job.id} with priority ${job.opts.priority}`));
      
      const { task, priority } = job.data;
      
      // Simulate priority-based processing
      await simulateWork(1000);
      
      return {
        task,
        priority,
        processedAt: new Date().toISOString(),
        status: 'completed',
      };
    }, {
      connection,
      concurrency: 5,
      autorun: true,
    });

    // 4. Delayed Worker
    delayedWorker = new Worker('delayed-queue', async (job) => {
      console.log(chalk.cyan(`⏰ Processing delayed job ${job.id} (delayed by ${job.opts.delay}ms)`));
      
      const { message, scheduledFor } = job.data;
      
      // Simulate delayed task processing
      await simulateWork(1500);
      
      return {
        message,
        scheduledFor,
        processedAt: new Date().toISOString(),
        delay: job.opts.delay,
      };
    }, {
      connection,
      concurrency: 3,
      autorun: true,
    });

    // 5. Recurring Worker
    recurringWorker = new Worker('recurring-queue', async (job) => {
      console.log(chalk.cyan(`🔄 Processing recurring job ${job.id}`));
      
      const { task, frequency } = job.data;
      
      // Simulate recurring task
      await simulateWork(1000);
      
      return {
        task,
        frequency,
        executedAt: new Date().toISOString(),
        nextExecution: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      };
    }, {
      connection,
      concurrency: 2,
      autorun: true,
    });

    // 6. Dependency Worker
    dependencyWorker = new Worker('dependency-queue', async (job) => {
      console.log(chalk.cyan(`🔗 Processing dependency job ${job.id}`));
      
      const { task, dependencies } = job.data;
      
      // Check if dependencies are completed
      if (dependencies && dependencies.length > 0) {
        console.log(chalk.yellow(`📋 Checking dependencies for job ${job.id}`));
        // In a real scenario, you'd check the status of dependent jobs
      }
      
      // Simulate dependent task processing
      await simulateWork(2000);
      
      return {
        task,
        dependencies,
        processedAt: new Date().toISOString(),
        status: 'completed',
      };
    }, {
      connection,
      concurrency: 3,
      autorun: true,
    });

    // 7. Rate Limited Worker
    rateLimitedWorker = new Worker('rate-limited-queue', async (job) => {
      console.log(chalk.cyan(`🚦 Processing rate-limited job ${job.id}`));
      
      const { apiCall, rateLimit } = job.data;
      
      // Simulate API call with rate limiting
      await simulateWork(1000);
      
      return {
        apiCall,
        rateLimit,
        processedAt: new Date().toISOString(),
        status: 'success',
      };
    }, {
      connection,
      concurrency: 1, // Single concurrency for rate limiting
      autorun: true,
    });

    // Setup rate limiting scheduler
    rateLimitScheduler = new JobScheduler('rate-limited-queue', {
      connection,
    });

    console.log(chalk.green('✅ All workers setup successfully!'));

    // Setup worker event listeners
    setupWorkerEventListeners();

  } catch (error) {
    console.error(chalk.red('❌ Error setting up workers:'), error);
    throw error;
  }
}

function setupWorkerEventListeners() {
  const workers = [
    { name: 'Email', worker: emailWorker },
    { name: 'Image Processing', worker: imageProcessingWorker },
    { name: 'Priority', worker: priorityWorker },
    { name: 'Delayed', worker: delayedWorker },
    { name: 'Recurring', worker: recurringWorker },
    { name: 'Dependency', worker: dependencyWorker },
    { name: 'Rate Limited', worker: rateLimitedWorker },
  ];

  workers.forEach(({ name, worker }) => {
    worker.on('completed', (job) => {
      console.log(chalk.green(`✅ [${name} Worker] Job ${job.id} completed successfully`));
    });

    worker.on('failed', (job, err) => {
      console.log(chalk.red(`❌ [${name} Worker] Job ${job.id} failed: ${err.message}`));
    });

    worker.on('error', (err) => {
      console.log(chalk.red(`💥 [${name} Worker] Error: ${err.message}`));
    });

    worker.on('stalled', (job) => {
      console.log(chalk.orange(`⚠️ [${name} Worker] Job ${job.id} stalled`));
    });
  });
}

// Utility function to simulate work
function simulateWork(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

// Get all workers
function getWorkers() {
  return {
    emailWorker,
    imageProcessingWorker,
    priorityWorker,
    delayedWorker,
    recurringWorker,
    dependencyWorker,
    rateLimitedWorker,
  };
}

// Clean up workers
async function cleanupWorkers() {
  try {
    const workers = getWorkers();
    for (const [name, worker] of Object.entries(workers)) {
      if (worker) {
        await worker.close();
        console.log(chalk.yellow(`🔒 Closed ${name}`));
      }
    }
    if (rateLimitScheduler) {
      await rateLimitScheduler.close();
      console.log(chalk.yellow('🔒 Closed rate limit scheduler'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error cleaning up workers:'), error);
  }
}

module.exports = {
  setupWorkers,
  getWorkers,
  cleanupWorkers,
};
