const axios = require('axios');

// Base URL for the API
const BASE_URL = 'http://localhost:3000';

// Example usage of the BullMQ Mock Application
class BullMQUsageExamples {
  constructor() {
    this.axios = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
    });
  }

  // Health check
  async checkHealth() {
    try {
      const response = await this.axios.get('/health');
      console.log('✅ Health Check:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Health Check Failed:', error.message);
    }
  }

  // Add email jobs
  async addEmailJobs() {
    console.log('\n📧 Adding Email Jobs...');
    
    const emailJobs = [
      {
        recipient: 'user1@example.com',
        subject: 'Welcome Email',
        body: 'Welcome to our platform!',
        priority: 1,
      },
      {
        recipient: 'user2@example.com',
        subject: 'Newsletter',
        body: 'Here is your weekly newsletter.',
        priority: 5,
      },
      {
        recipient: 'user3@example.com',
        subject: 'Important Update',
        body: 'Critical system update notification.',
        priority: 1,
      },
    ];

    for (const emailJob of emailJobs) {
      try {
        const response = await this.axios.post('/api/queues/email/add', emailJob);
        console.log(`✅ Email job added: ${response.data.data.jobId}`);
      } catch (error) {
        console.error(`❌ Failed to add email job: ${error.message}`);
      }
    }
  }

  // Add image processing jobs
  async addImageProcessingJobs() {
    console.log('\n🖼️ Adding Image Processing Jobs...');
    
    const imageJobs = [
      {
        imageUrl: 'https://example.com/image1.jpg',
        operations: ['resize', 'compress'],
        priority: 0,
      },
      {
        imageUrl: 'https://example.com/image2.jpg',
        operations: ['resize', 'compress', 'watermark'],
        priority: 0,
      },
    ];

    for (const imageJob of imageJobs) {
      try {
        const response = await this.axios.post('/api/queues/image-processing/add', imageJob);
        console.log(`✅ Image processing job added: ${response.data.data.jobId}`);
      } catch (error) {
        console.error(`❌ Failed to add image processing job: ${error.message}`);
      }
    }
  }

  // Add priority jobs
  async addPriorityJobs() {
    console.log('\n⚡ Adding Priority Jobs...');
    
    const priorityJobs = [
      {
        task: 'Urgent system maintenance',
        priority: 1,
        description: 'Critical system update required',
      },
      {
        task: 'Regular data backup',
        priority: 10,
        description: 'Scheduled backup operation',
      },
      {
        task: 'User notification',
        priority: 5,
        description: 'Send user notification',
      },
    ];

    for (const priorityJob of priorityJobs) {
      try {
        const response = await this.axios.post('/api/queues/priority/add', priorityJob);
        console.log(`✅ Priority job added: ${response.data.data.jobId} (Priority: ${priorityJob.priority})`);
      } catch (error) {
        console.error(`❌ Failed to add priority job: ${error.message}`);
      }
    }
  }

  // Add delayed jobs
  async addDelayedJobs() {
    console.log('\n⏰ Adding Delayed Jobs...');
    
    const delayedJobs = [
      {
        message: 'This will execute in 5 seconds',
        delay: 5000,
      },
      {
        message: 'This will execute in 15 seconds',
        delay: 15000,
      },
    ];

    for (const delayedJob of delayedJobs) {
      try {
        const response = await this.axios.post('/api/queues/delayed/add', delayedJob);
        console.log(`✅ Delayed job added: ${response.data.data.jobId} (Delay: ${delayedJob.delay}ms)`);
      } catch (error) {
        console.error(`❌ Failed to add delayed job: ${error.message}`);
      }
    }
  }

  // Add dependency jobs
  async addDependencyJobs() {
    console.log('\n🔗 Adding Dependency Jobs...');
    
    const dependencyJobs = [
      {
        task: 'Data validation',
        dependencies: [],
        description: 'Validate input data',
      },
      {
        task: 'Data processing',
        dependencies: ['data-validation'],
        description: 'Process validated data',
      },
      {
        task: 'Result notification',
        dependencies: ['data-processing'],
        description: 'Notify about processing results',
      },
    ];

    for (const dependencyJob of dependencyJobs) {
      try {
        const response = await this.axios.post('/api/queues/dependency/add', dependencyJob);
        console.log(`✅ Dependency job added: ${response.data.data.jobId}`);
      } catch (error) {
        console.error(`❌ Failed to add dependency job: ${error.message}`);
      }
    }
  }

  // Add rate-limited jobs
  async addRateLimitedJobs() {
    console.log('\n🚦 Adding Rate-Limited Jobs...');
    
    const rateLimitedJobs = [
      {
        apiCall: 'GET /api/users/1',
        rateLimit: 1000,
      },
      {
        apiCall: 'POST /api/orders',
        rateLimit: 2000,
      },
      {
        apiCall: 'GET /api/products',
        rateLimit: 1500,
      },
    ];

    for (const rateLimitedJob of rateLimitedJobs) {
      try {
        const response = await this.axios.post('/api/queues/rate-limited/add', rateLimitedJob);
        console.log(`✅ Rate-limited job added: ${response.data.data.jobId}`);
      } catch (error) {
        console.error(`❌ Failed to add rate-limited job: ${error.message}`);
      }
    }
  }

  // Get queue status
  async getQueueStatus() {
    console.log('\n📊 Getting Queue Status...');
    
    try {
      const response = await this.axios.get('/api/queues');
      console.log('✅ Queue Status:');
      
      Object.entries(response.data.data).forEach(([queueName, status]) => {
        console.log(`  ${queueName}:`);
        console.log(`    Waiting: ${status.waiting}`);
        console.log(`    Active: ${status.active}`);
        console.log(`    Completed: ${status.completed}`);
        console.log(`    Failed: ${status.failed}`);
        console.log(`    Delayed: ${status.delayed}`);
        console.log(`    Paused: ${status.paused}`);
      });
    } catch (error) {
      console.error(`❌ Failed to get queue status: ${error.message}`);
    }
  }

  // Get monitoring dashboard
  async getMonitoringDashboard() {
    console.log('\n📈 Getting Monitoring Dashboard...');
    
    try {
      const response = await this.axios.get('/api/monitor/dashboard');
      const data = response.data.data;
      
      console.log('✅ Monitoring Dashboard:');
      console.log(`  System Health: ${data.systemHealth.status}`);
      console.log(`  Total Queues: ${Object.keys(data.queues).length}`);
      console.log(`  Recent Alerts: ${data.alerts.length}`);
      console.log(`  Recurring Jobs: ${data.recurringJobs}`);
    } catch (error) {
      console.error(`❌ Failed to get monitoring dashboard: ${error.message}`);
    }
  }

  // Get system statistics
  async getSystemStats() {
    console.log('\n📊 Getting System Statistics...');
    
    try {
      const response = await this.axios.get('/api/monitor/stats');
      const stats = response.data.data;
      
      console.log('✅ System Statistics:');
      console.log(`  System Status: ${stats.system.status}`);
      console.log(`  Total Jobs: ${stats.jobs.waiting + stats.jobs.active + stats.jobs.completed + stats.jobs.failed + stats.jobs.delayed}`);
      console.log(`  Completed Jobs: ${stats.performance.totalCompleted}`);
      console.log(`  Failed Jobs: ${stats.performance.totalFailed}`);
      console.log(`  Average Processing Time: ${stats.performance.avgProcessingTime}ms`);
      console.log(`  Total Alerts: ${stats.alerts.total}`);
    } catch (error) {
      console.error(`❌ Failed to get system stats: ${error.message}`);
    }
  }

  // Get jobs from a specific queue
  async getJobsFromQueue(queueName, status = 'waiting') {
    console.log(`\n📋 Getting ${status} jobs from ${queueName} queue...`);
    
    try {
      const response = await this.axios.get(`/api/jobs/${queueName}?status=${status}&limit=5`);
      const jobs = response.data.data.jobs;
      
      console.log(`✅ Found ${jobs.length} ${status} jobs in ${queueName}:`);
      jobs.forEach((job, index) => {
        console.log(`  ${index + 1}. Job ID: ${job.id}`);
        console.log(`     Name: ${job.name}`);
        console.log(`     Priority: ${job.priority || 'default'}`);
        console.log(`     Timestamp: ${new Date(job.timestamp).toLocaleString()}`);
      });
    } catch (error) {
      console.error(`❌ Failed to get jobs from ${queueName}: ${error.message}`);
    }
  }

  // Pause and resume a queue
  async testQueuePauseResume() {
    console.log('\n⏸️ Testing Queue Pause/Resume...');
    
    const queueName = 'email';
    
    try {
      // Pause the queue
      console.log(`Pausing ${queueName} queue...`);
      await this.axios.post(`/api/queues/${queueName}/pause`);
      console.log(`✅ ${queueName} queue paused`);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Resume the queue
      console.log(`Resuming ${queueName} queue...`);
      await this.axios.post(`/api/queues/${queueName}/resume`);
      console.log(`✅ ${queueName} queue resumed`);
    } catch (error) {
      console.error(`❌ Failed to pause/resume queue: ${error.message}`);
    }
  }

  // Run all examples
  async runAllExamples() {
    console.log('🚀 Running BullMQ Usage Examples...\n');
    
    // Check health first
    await this.checkHealth();
    
    // Add various types of jobs
    await this.addEmailJobs();
    await this.addImageProcessingJobs();
    await this.addPriorityJobs();
    await this.addDelayedJobs();
    await this.addDependencyJobs();
    await this.addRateLimitedJobs();
    
    // Wait a bit for jobs to be processed
    console.log('\n⏳ Waiting for jobs to be processed...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get status and monitoring information
    await this.getQueueStatus();
    await this.getMonitoringDashboard();
    await this.getSystemStats();
    
    // Get jobs from specific queues
    await this.getJobsFromQueue('email', 'waiting');
    await this.getJobsFromQueue('email', 'completed');
    
    // Test queue pause/resume
    await this.testQueuePauseResume();
    
    console.log('\n🎉 All examples completed!');
    console.log('\n💡 Tips:');
    console.log('  - Check the console output for real-time job processing');
    console.log('  - Use the API endpoints to monitor queue status');
    console.log('  - Run the test scenarios with: npm run test');
    console.log('  - Visit http://localhost:3000 for API documentation');
  }
}

// Export the class
module.exports = BullMQUsageExamples;

// Run examples if this file is executed directly
if (require.main === module) {
  const examples = new BullMQUsageExamples();
  examples.runAllExamples().catch(console.error);
}
