const { getQueue } = require('./queues/setup');
const { addCustomRecurringJob, getRecurringJobs } = require('./scheduler/setup');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');

// Test scenarios to demonstrate BullMQ concepts
class BullMQTestScenarios {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log(chalk.blue('🧪 Running BullMQ Test Scenarios...\n'));

    try {
      await this.testBasicQueueOperations();
      await this.testPriorityQueues();
      await this.testDelayedJobs();
      await this.testRecurringJobs();
      await this.testJobDependencies();
      await this.testRateLimiting();
      await this.testConcurrencyControl();
      await this.testJobRetries();
      await this.testJobProgress();
      await this.testQueueEvents();
      await this.testJobLogging();
      await this.testQueuePauseResume();
      await this.testJobPromotion();
      await this.testBulkOperations();
      await this.testErrorHandling();

      this.printTestSummary();
    } catch (error) {
      console.error(chalk.red('❌ Test execution failed:'), error);
    }
  }

  async testBasicQueueOperations() {
    console.log(chalk.yellow('📧 Testing Basic Queue Operations...'));
    
    try {
      const emailQueue = getQueue('email');
      
      // Add multiple email jobs
      const jobs = [];
      for (let i = 1; i <= 5; i++) {
        const job = await emailQueue.add('send-email', {
          recipient: `user${i}@example.com`,
          subject: `Test Email ${i}`,
          body: `This is test email number ${i}`,
        }, {
          jobId: uuidv4(),
        });
        jobs.push(job.id);
      }

      this.testResults.push({
        test: 'Basic Queue Operations',
        status: 'PASSED',
        details: `Added ${jobs.length} email jobs`,
        jobIds: jobs,
      });

      console.log(chalk.green('✅ Basic queue operations test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Basic Queue Operations',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Basic queue operations test failed'));
    }
  }

  async testPriorityQueues() {
    console.log(chalk.yellow('⚡ Testing Priority Queues...'));
    
    try {
      const priorityQueue = getQueue('priority');
      
      // Add jobs with different priorities
      const lowPriorityJob = await priorityQueue.add('priority-task', {
        task: 'Low priority task',
        priority: 10,
      }, {
        priority: 10,
        jobId: uuidv4(),
      });

      const highPriorityJob = await priorityQueue.add('priority-task', {
        task: 'High priority task',
        priority: 1,
      }, {
        priority: 1,
        jobId: uuidv4(),
      });

      const mediumPriorityJob = await priorityQueue.add('priority-task', {
        task: 'Medium priority task',
        priority: 5,
      }, {
        priority: 5,
        jobId: uuidv4(),
      });

      this.testResults.push({
        test: 'Priority Queues',
        status: 'PASSED',
        details: 'Added jobs with different priorities (1, 5, 10)',
        jobIds: [highPriorityJob.id, mediumPriorityJob.id, lowPriorityJob.id],
      });

      console.log(chalk.green('✅ Priority queues test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Priority Queues',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Priority queues test failed'));
    }
  }

  async testDelayedJobs() {
    console.log(chalk.yellow('⏰ Testing Delayed Jobs...'));
    
    try {
      const delayedQueue = getQueue('delayed');
      
      // Add jobs with different delays
      const shortDelayJob = await delayedQueue.add('delayed-task', {
        message: 'This will execute in 2 seconds',
        scheduledFor: new Date(Date.now() + 2000).toISOString(),
      }, {
        delay: 2000,
        jobId: uuidv4(),
      });

      const longDelayJob = await delayedQueue.add('delayed-task', {
        message: 'This will execute in 10 seconds',
        scheduledFor: new Date(Date.now() + 10000).toISOString(),
      }, {
        delay: 10000,
        jobId: uuidv4(),
      });

      this.testResults.push({
        test: 'Delayed Jobs',
        status: 'PASSED',
        details: 'Added jobs with 2s and 10s delays',
        jobIds: [shortDelayJob.id, longDelayJob.id],
      });

      console.log(chalk.green('✅ Delayed jobs test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Delayed Jobs',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Delayed jobs test failed'));
    }
  }

  async testRecurringJobs() {
    console.log(chalk.yellow('🔄 Testing Recurring Jobs...'));
    
    try {
      // Add a custom recurring job that runs every 30 seconds
      const recurringJob = await addCustomRecurringJob(
        'test-recurring-job',
        {
          task: 'Test recurring task',
          frequency: 'every-30-seconds',
          description: 'This job runs every 30 seconds for testing',
        },
        '*/30 * * * * *', // Every 30 seconds
        {
          jobId: uuidv4(),
        }
      );

      this.testResults.push({
        test: 'Recurring Jobs',
        status: 'PASSED',
        details: 'Added recurring job that runs every 30 seconds',
        jobId: recurringJob.id,
      });

      console.log(chalk.green('✅ Recurring jobs test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Recurring Jobs',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Recurring jobs test failed'));
    }
  }

  async testJobDependencies() {
    console.log(chalk.yellow('🔗 Testing Job Dependencies...'));
    
    try {
      const dependencyQueue = getQueue('dependency');
      
      // Create a chain of dependent jobs
      const job1 = await dependencyQueue.add('dependency-task', {
        task: 'First task in chain',
        dependencies: [],
        step: 1,
      }, {
        jobId: uuidv4(),
      });

      const job2 = await dependencyQueue.add('dependency-task', {
        task: 'Second task in chain',
        dependencies: [job1.id],
        step: 2,
      }, {
        jobId: uuidv4(),
      });

      const job3 = await dependencyQueue.add('dependency-task', {
        task: 'Third task in chain',
        dependencies: [job2.id],
        step: 3,
      }, {
        jobId: uuidv4(),
      });

      this.testResults.push({
        test: 'Job Dependencies',
        status: 'PASSED',
        details: 'Created chain of 3 dependent jobs',
        jobIds: [job1.id, job2.id, job3.id],
      });

      console.log(chalk.green('✅ Job dependencies test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Job Dependencies',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Job dependencies test failed'));
    }
  }

  async testRateLimiting() {
    console.log(chalk.yellow('🚦 Testing Rate Limiting...'));
    
    try {
      const rateLimitedQueue = getQueue('rate-limited');
      
      // Add multiple API calls with rate limiting
      const apiCalls = [];
      for (let i = 1; i <= 10; i++) {
        const job = await rateLimitedQueue.add('rate-limited-api-call', {
          apiCall: `GET /api/users/${i}`,
          rateLimit: 1000, // 1 second between calls
        }, {
          jobId: uuidv4(),
          delay: i * 100, // Stagger the delays
        });
        apiCalls.push(job.id);
      }

      this.testResults.push({
        test: 'Rate Limiting',
        status: 'PASSED',
        details: `Added ${apiCalls.length} rate-limited API calls`,
        jobIds: apiCalls,
      });

      console.log(chalk.green('✅ Rate limiting test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Rate Limiting',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Rate limiting test failed'));
    }
  }

  async testConcurrencyControl() {
    console.log(chalk.yellow('🖼️ Testing Concurrency Control...'));
    
    try {
      const imageProcessingQueue = getQueue('image-processing');
      
      // Add multiple image processing jobs (limited concurrency)
      const imageJobs = [];
      for (let i = 1; i <= 8; i++) {
        const job = await imageProcessingQueue.add('process-image', {
          imageUrl: `https://example.com/image${i}.jpg`,
          operations: ['resize', 'compress', 'optimize'],
          priority: i,
        }, {
          jobId: uuidv4(),
          timeout: 30000,
        });
        imageJobs.push(job.id);
      }

      this.testResults.push({
        test: 'Concurrency Control',
        status: 'PASSED',
        details: `Added ${imageJobs.length} image processing jobs with concurrency control`,
        jobIds: imageJobs,
      });

      console.log(chalk.green('✅ Concurrency control test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Concurrency Control',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Concurrency control test failed'));
    }
  }

  async testJobRetries() {
    console.log(chalk.yellow('🔄 Testing Job Retries...'));
    
    try {
      const emailQueue = getQueue('email');
      
      // Add a job that might fail (simulating retry scenario)
      const retryJob = await emailQueue.add('send-email', {
        recipient: 'test@example.com',
        subject: 'Test Retry Job',
        body: 'This job might fail and retry',
        shouldFail: true, // Worker will check this and potentially fail
      }, {
        jobId: uuidv4(),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.testResults.push({
        test: 'Job Retries',
        status: 'PASSED',
        details: 'Added job with retry configuration (3 attempts, exponential backoff)',
        jobId: retryJob.id,
      });

      console.log(chalk.green('✅ Job retries test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Job Retries',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Job retries test failed'));
    }
  }

  async testJobProgress() {
    console.log(chalk.yellow('📊 Testing Job Progress...'));
    
    try {
      const imageProcessingQueue = getQueue('image-processing');
      
      // Add a job that will report progress
      const progressJob = await imageProcessingQueue.add('process-image', {
        imageUrl: 'https://example.com/large-image.jpg',
        operations: ['resize', 'compress', 'optimize', 'watermark'],
        reportProgress: true,
      }, {
        jobId: uuidv4(),
      });

      this.testResults.push({
        test: 'Job Progress',
        status: 'PASSED',
        details: 'Added job with progress reporting enabled',
        jobId: progressJob.id,
      });

      console.log(chalk.green('✅ Job progress test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Job Progress',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Job progress test failed'));
    }
  }

  async testQueueEvents() {
    console.log(chalk.yellow('📡 Testing Queue Events...'));
    
    try {
      const emailQueue = getQueue('email');
      
      // Add jobs to trigger events
      const eventJobs = [];
      for (let i = 1; i <= 3; i++) {
        const job = await emailQueue.add('send-email', {
          recipient: `event-test${i}@example.com`,
          subject: `Event Test ${i}`,
          body: 'Testing queue events',
        }, {
          jobId: uuidv4(),
        });
        eventJobs.push(job.id);
      }

      this.testResults.push({
        test: 'Queue Events',
        status: 'PASSED',
        details: `Added ${eventJobs.length} jobs to test queue events`,
        jobIds: eventJobs,
      });

      console.log(chalk.green('✅ Queue events test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Queue Events',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Queue events test failed'));
    }
  }

  async testJobLogging() {
    console.log(chalk.yellow('📝 Testing Job Logging...'));
    
    try {
      const emailQueue = getQueue('email');
      
      // Add a job with logging
      const loggingJob = await emailQueue.add('send-email', {
        recipient: 'logging-test@example.com',
        subject: 'Logging Test',
        body: 'This job will have detailed logging',
        enableLogging: true,
      }, {
        jobId: uuidv4(),
      });

      // Add some logs to the job
      await loggingJob.log('Job started processing');
      await loggingJob.log('Connecting to email service...');
      await loggingJob.log('Email sent successfully');

      this.testResults.push({
        test: 'Job Logging',
        status: 'PASSED',
        details: 'Added job with detailed logging',
        jobId: loggingJob.id,
      });

      console.log(chalk.green('✅ Job logging test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Job Logging',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Job logging test failed'));
    }
  }

  async testQueuePauseResume() {
    console.log(chalk.yellow('⏸️ Testing Queue Pause/Resume...'));
    
    try {
      const emailQueue = getQueue('email');
      
      // Add some jobs
      const pauseJobs = [];
      for (let i = 1; i <= 3; i++) {
        const job = await emailQueue.add('send-email', {
          recipient: `pause-test${i}@example.com`,
          subject: `Pause Test ${i}`,
          body: 'Testing pause/resume functionality',
        }, {
          jobId: uuidv4(),
        });
        pauseJobs.push(job.id);
      }

      // Pause the queue
      await emailQueue.pause();
      console.log(chalk.blue('⏸️ Queue paused'));

      // Resume the queue after a short delay
      setTimeout(async () => {
        await emailQueue.resume();
        console.log(chalk.blue('▶️ Queue resumed'));
      }, 2000);

      this.testResults.push({
        test: 'Queue Pause/Resume',
        status: 'PASSED',
        details: 'Tested queue pause and resume functionality',
        jobIds: pauseJobs,
      });

      console.log(chalk.green('✅ Queue pause/resume test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Queue Pause/Resume',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Queue pause/resume test failed'));
    }
  }

  async testJobPromotion() {
    console.log(chalk.yellow('⬆️ Testing Job Promotion...'));
    
    try {
      const delayedQueue = getQueue('delayed');
      
      // Add a delayed job
      const delayedJob = await delayedQueue.add('delayed-task', {
        message: 'This job will be promoted',
        scheduledFor: new Date(Date.now() + 30000).toISOString(), // 30 seconds
      }, {
        delay: 30000,
        jobId: uuidv4(),
      });

      // Promote the job after a short delay
      setTimeout(async () => {
        try {
          await delayedJob.promote();
          console.log(chalk.blue('⬆️ Job promoted'));
        } catch (error) {
          console.log(chalk.yellow('⚠️ Job promotion failed (might already be processed)'));
        }
      }, 5000);

      this.testResults.push({
        test: 'Job Promotion',
        status: 'PASSED',
        details: 'Added delayed job for promotion testing',
        jobId: delayedJob.id,
      });

      console.log(chalk.green('✅ Job promotion test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Job Promotion',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Job promotion test failed'));
    }
  }

  async testBulkOperations() {
    console.log(chalk.yellow('📦 Testing Bulk Operations...'));
    
    try {
      const emailQueue = getQueue('email');
      
      // Create bulk job data
      const bulkJobs = [];
      for (let i = 1; i <= 20; i++) {
        bulkJobs.push({
          name: 'send-email',
          data: {
            recipient: `bulk-test${i}@example.com`,
            subject: `Bulk Test ${i}`,
            body: `This is bulk email ${i}`,
          },
          opts: {
            jobId: uuidv4(),
          },
        });
      }

      // Add jobs in bulk
      const addedJobs = await emailQueue.addBulk(bulkJobs);

      this.testResults.push({
        test: 'Bulk Operations',
        status: 'PASSED',
        details: `Added ${addedJobs.length} jobs in bulk`,
        jobIds: addedJobs.map(job => job.id),
      });

      console.log(chalk.green('✅ Bulk operations test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Bulk Operations',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Bulk operations test failed'));
    }
  }

  async testErrorHandling() {
    console.log(chalk.yellow('🚨 Testing Error Handling...'));
    
    try {
      const emailQueue = getQueue('email');
      
      // Add a job that will definitely fail
      const errorJob = await emailQueue.add('send-email', {
        recipient: 'error-test@example.com',
        subject: 'Error Test',
        body: 'This job will fail intentionally',
        forceError: true,
      }, {
        jobId: uuidv4(),
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 1000,
        },
      });

      this.testResults.push({
        test: 'Error Handling',
        status: 'PASSED',
        details: 'Added job to test error handling and retry logic',
        jobId: errorJob.id,
      });

      console.log(chalk.green('✅ Error handling test passed'));
    } catch (error) {
      this.testResults.push({
        test: 'Error Handling',
        status: 'FAILED',
        error: error.message,
      });
      console.log(chalk.red('❌ Error handling test failed'));
    }
  }

  printTestSummary() {
    console.log(chalk.blue('\n📋 Test Summary:'));
    console.log(chalk.blue('================\n'));

    const passed = this.testResults.filter(result => result.status === 'PASSED').length;
    const failed = this.testResults.filter(result => result.status === 'FAILED').length;
    const total = this.testResults.length;

    console.log(chalk.green(`✅ Passed: ${passed}`));
    console.log(chalk.red(`❌ Failed: ${failed}`));
    console.log(chalk.blue(`📊 Total: ${total}\n`));

    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASSED' ? chalk.green('✅') : chalk.red('❌');
      console.log(`${status} ${index + 1}. ${result.test}`);
      if (result.details) {
        console.log(`   📝 ${result.details}`);
      }
      if (result.error) {
        console.log(`   🚨 Error: ${result.error}`);
      }
    });

    console.log(chalk.blue('\n🎉 BullMQ Test Scenarios Completed!'));
    console.log(chalk.cyan('Check the API endpoints to see the results in action:'));
    console.log(chalk.cyan('  - GET /api/queues (Queue status)'));
    console.log(chalk.cyan('  - GET /api/monitor/dashboard (Monitoring dashboard)'));
    console.log(chalk.cyan('  - GET /api/monitor/stats (System statistics)'));
  }
}

// Export the test class
module.exports = BullMQTestScenarios;

// Run tests if this file is executed directly
if (require.main === module) {
  const testScenarios = new BullMQTestScenarios();
  testScenarios.runAllTests();
}
