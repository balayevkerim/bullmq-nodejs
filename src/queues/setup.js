const { Queue, JobScheduler } = require('bullmq');
const config = require('../../config');
const chalk = require('chalk');

// Queue instances
let emailQueue;
let imageProcessingQueue;
let priorityQueue;
let delayedQueue;
let recurringQueue;
let dependencyQueue;
let rateLimitedQueue;

// Queue scheduler for delayed jobs
let queueScheduler;

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
};

async function setupQueues() {
  try {
    console.log(chalk.blue('📦 Setting up BullMQ queues...'));

    // 1. Basic Email Queue
    emailQueue = new Queue('email-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: config.queue.removeOnComplete,
        removeOnFail: config.queue.removeOnFail,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    // 2. Image Processing Queue with concurrency control
    imageProcessingQueue = new Queue('image-processing-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: config.queue.removeOnComplete,
        removeOnFail: config.queue.removeOnFail,
        attempts: 2,
        timeout: 30000, // 30 seconds timeout
      },
    });

    // 3. Priority Queue for urgent tasks
    priorityQueue = new Queue('priority-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: config.queue.removeOnComplete,
        removeOnFail: config.queue.removeOnFail,
        priority: 0, // Default priority
      },
    });

    // 4. Delayed Queue for scheduled tasks
    delayedQueue = new Queue('delayed-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: config.queue.removeOnComplete,
        removeOnFail: config.queue.removeOnFail,
        delay: 0, // No default delay
      },
    });

    // 5. Recurring Queue for periodic tasks
    recurringQueue = new Queue('recurring-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: config.queue.removeOnComplete,
        removeOnFail: config.queue.removeOnFail,
      },
    });

    // 6. Dependency Queue for job dependencies
    dependencyQueue = new Queue('dependency-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: config.queue.removeOnComplete,
        removeOnFail: config.queue.removeOnFail,
      },
    });

    // 7. Rate Limited Queue
    rateLimitedQueue = new Queue('rate-limited-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: config.queue.removeOnComplete,
        removeOnFail: config.queue.removeOnFail,
      },
    });

    // Setup Queue Scheduler for delayed jobs
    queueScheduler = new JobScheduler('delayed-queue', {
      connection,
    });

    console.log(chalk.green('✅ All queues setup successfully!'));

    // Setup queue event listeners for monitoring
    setupQueueEventListeners();

  } catch (error) {
    console.error(chalk.red('❌ Error setting up queues:'), error);
    throw error;
  }
}

function setupQueueEventListeners() {
  const queues = [
    { name: 'Email', queue: emailQueue },
    { name: 'Image Processing', queue: imageProcessingQueue },
    { name: 'Priority', queue: priorityQueue },
    { name: 'Delayed', queue: delayedQueue },
    { name: 'Recurring', queue: recurringQueue },
    { name: 'Dependency', queue: dependencyQueue },
    { name: 'Rate Limited', queue: rateLimitedQueue },
  ];

  queues.forEach(({ name, queue }) => {
    queue.on('waiting', (job) => {
      console.log(chalk.yellow(`⏳ [${name}] Job ${job.id} waiting`));
    });

    queue.on('active', (job) => {
      console.log(chalk.blue(`🔄 [${name}] Job ${job.id} started processing`));
    });

    queue.on('completed', (job) => {
      console.log(chalk.green(`✅ [${name}] Job ${job.id} completed`));
    });

    queue.on('failed', (job, err) => {
      console.log(chalk.red(`❌ [${name}] Job ${job.id} failed: ${err.message}`));
    });

    queue.on('stalled', (job) => {
      console.log(chalk.orange(`⚠️ [${name}] Job ${job.id} stalled`));
    });
  });
}

// Get all queues
function getQueues() {
  return {
    emailQueue,
    imageProcessingQueue,
    priorityQueue,
    delayedQueue,
    recurringQueue,
    dependencyQueue,
    rateLimitedQueue,
  };
}

// Get specific queue by name
function getQueue(queueName) {
  const queues = getQueues();
  const queueMap = {
    'email': queues.emailQueue,
    'image-processing': queues.imageProcessingQueue,
    'priority': queues.priorityQueue,
    'delayed': queues.delayedQueue,
    'recurring': queues.recurringQueue,
    'dependency': queues.dependencyQueue,
    'rate-limited': queues.rateLimitedQueue,
  };
  return queueMap[queueName];
}

// Clean up queues
async function cleanupQueues() {
  try {
    const queues = getQueues();
    for (const [name, queue] of Object.entries(queues)) {
      if (queue) {
        await queue.close();
        console.log(chalk.yellow(`🔒 Closed ${name}`));
      }
    }
    if (queueScheduler) {
      await queueScheduler.close();
      console.log(chalk.yellow('🔒 Closed queue scheduler'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error cleaning up queues:'), error);
  }
}

module.exports = {
  setupQueues,
  getQueues,
  getQueue,
  cleanupQueues,
};
