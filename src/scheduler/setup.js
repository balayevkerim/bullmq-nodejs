const { Queue } = require('bullmq');
const config = require('../../config');
const chalk = require('chalk');

let recurringQueue;
let schedulerQueue;

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
};

async function setupScheduler() {
  try {
    console.log(chalk.blue('⏰ Setting up BullMQ scheduler...'));

    // Get the recurring queue from the main setup
    const { getQueue } = require('../queues/setup');
    recurringQueue = getQueue('recurring');

    // Create a dedicated scheduler queue for complex scheduling
    schedulerQueue = new Queue('scheduler-queue', {
      connection,
      defaultJobOptions: {
        removeOnComplete: config.queue.removeOnComplete,
        removeOnFail: config.queue.removeOnFail,
      },
    });

    // Setup recurring jobs with different patterns
    await setupRecurringJobs();

    console.log(chalk.green('✅ Scheduler setup successfully!'));

  } catch (error) {
    console.error(chalk.red('❌ Error setting up scheduler:'), error);
    throw error;
  }
}

async function setupRecurringJobs() {
  try {
    // 1. Daily cleanup job (every day at 2 AM)
    await recurringQueue.add('daily-cleanup', {
      task: 'cleanup-old-files',
      frequency: 'daily',
      description: 'Clean up old temporary files and logs',
    }, {
      repeat: {
        pattern: '0 2 * * *', // Cron pattern: every day at 2 AM
      },
    });

    // 2. Hourly health check (every hour)
    await recurringQueue.add('hourly-health-check', {
      task: 'system-health-check',
      frequency: 'hourly',
      description: 'Check system health and send alerts if needed',
    }, {
      repeat: {
        pattern: '0 * * * *', // Cron pattern: every hour
      },
    });

    // 3. Weekly report generation (every Monday at 9 AM)
    await recurringQueue.add('weekly-report', {
      task: 'generate-weekly-report',
      frequency: 'weekly',
      description: 'Generate and email weekly performance report',
    }, {
      repeat: {
        pattern: '0 9 * * 1', // Cron pattern: every Monday at 9 AM
      },
    });

    // 4. Monthly backup (first day of every month at 3 AM)
    await recurringQueue.add('monthly-backup', {
      task: 'database-backup',
      frequency: 'monthly',
      description: 'Create monthly database backup',
    }, {
      repeat: {
        pattern: '0 3 1 * *', // Cron pattern: first day of every month at 3 AM
      },
    });

    // 5. Every 5 minutes monitoring job
    await recurringQueue.add('monitoring-check', {
      task: 'service-monitoring',
      frequency: 'every-5-minutes',
      description: 'Check service status and performance metrics',
    }, {
      repeat: {
        pattern: '*/5 * * * *', // Cron pattern: every 5 minutes
      },
    });

    // 6. Business hours job (weekdays 9 AM to 5 PM, every 30 minutes)
    await recurringQueue.add('business-hours-task', {
      task: 'business-process',
      frequency: 'business-hours',
      description: 'Process business tasks during working hours',
    }, {
      repeat: {
        pattern: '*/30 9-17 * * 1-5', // Cron pattern: every 30 minutes, 9 AM to 5 PM, weekdays
      },
    });

    // 7. Weekend maintenance (every Saturday at 1 AM)
    await recurringQueue.add('weekend-maintenance', {
      task: 'system-maintenance',
      frequency: 'weekly',
      description: 'Perform system maintenance during weekend',
    }, {
      repeat: {
        pattern: '0 1 * * 6', // Cron pattern: every Saturday at 1 AM
      },
    });

    console.log(chalk.green('✅ Recurring jobs scheduled successfully!'));

  } catch (error) {
    console.error(chalk.red('❌ Error setting up recurring jobs:'), error);
    throw error;
  }
}

// Function to add a custom recurring job
async function addCustomRecurringJob(name, data, cronPattern, options = {}) {
  try {
    const job = await recurringQueue.add(name, data, {
      repeat: {
        pattern: cronPattern,
      },
      ...options,
    });

    console.log(chalk.green(`✅ Custom recurring job '${name}' scheduled with pattern: ${cronPattern}`));
    return job;
  } catch (error) {
    console.error(chalk.red(`❌ Error adding custom recurring job '${name}':`), error);
    throw error;
  }
}

// Function to remove a recurring job
async function removeRecurringJob(name) {
  try {
    const repeatableJobs = await recurringQueue.getRepeatableJobs();
    const job = repeatableJobs.find(job => job.name === name);
    
    if (job) {
      await recurringQueue.removeRepeatableByKey(job.key);
      console.log(chalk.green(`✅ Recurring job '${name}' removed successfully`));
      return true;
    } else {
      console.log(chalk.yellow(`⚠️ Recurring job '${name}' not found`));
      return false;
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error removing recurring job '${name}':`), error);
    throw error;
  }
}

// Function to get all recurring jobs
async function getRecurringJobs() {
  try {
    const repeatableJobs = await recurringQueue.getRepeatableJobs();
    return repeatableJobs.map(job => ({
      name: job.name,
      pattern: job.pattern,
      next: job.next,
      id: job.id,
      key: job.key,
    }));
  } catch (error) {
    console.error(chalk.red('❌ Error getting recurring jobs:'), error);
    throw error;
  }
}

// Function to pause/resume recurring jobs
async function toggleRecurringJobs(pause = true) {
  try {
    if (pause) {
      await recurringQueue.pause();
      console.log(chalk.yellow('⏸️ Recurring jobs paused'));
    } else {
      await recurringQueue.resume();
      console.log(chalk.green('▶️ Recurring jobs resumed'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error toggling recurring jobs:'), error);
    throw error;
  }
}

// Clean up scheduler
async function cleanupScheduler() {
  try {
    if (schedulerQueue) {
      await schedulerQueue.close();
      console.log(chalk.yellow('🔒 Closed scheduler queue'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error cleaning up scheduler:'), error);
  }
}

module.exports = {
  setupScheduler,
  addCustomRecurringJob,
  removeRecurringJob,
  getRecurringJobs,
  toggleRecurringJobs,
  cleanupScheduler,
};
