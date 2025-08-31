const { Queue } = require('bullmq');
const config = require('../../config');
const chalk = require('chalk');

let monitoringData = {
  queues: {},
  workers: {},
  performance: {},
  alerts: [],
};

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
};

async function setupMonitor() {
  try {
    console.log(chalk.blue('📊 Setting up BullMQ monitor...'));

    // Start monitoring all queues
    await startQueueMonitoring();

    // Start performance monitoring
    startPerformanceMonitoring();

    // Start alert system
    startAlertSystem();

    console.log(chalk.green('✅ Monitor setup successfully!'));

  } catch (error) {
    console.error(chalk.red('❌ Error setting up monitor:'), error);
    throw error;
  }
}

async function startQueueMonitoring() {
  const { getQueues } = require('../queues/setup');
  const queues = getQueues();

  const queueNames = [
    'email-queue',
    'image-processing-queue',
    'priority-queue',
    'delayed-queue',
    'recurring-queue',
    'dependency-queue',
    'rate-limited-queue',
  ];

  // Monitor each queue
  for (const queueName of queueNames) {
    const queue = new Queue(queueName, { connection });
    
    // Setup queue event listeners for monitoring
    setupQueueMonitoring(queue, queueName);
    
    // Initial queue status
    await updateQueueStatus(queue, queueName);
  }

  // Update queue status every 30 seconds
  setInterval(async () => {
    for (const queueName of queueNames) {
      const queue = new Queue(queueName, { connection });
      await updateQueueStatus(queue, queueName);
      await queue.close();
    }
  }, 30000);
}

function setupQueueMonitoring(queue, queueName) {
  queue.on('waiting', (job) => {
    addMonitoringEvent(queueName, 'waiting', job);
  });

  queue.on('active', (job) => {
    addMonitoringEvent(queueName, 'active', job);
  });

  queue.on('completed', (job) => {
    addMonitoringEvent(queueName, 'completed', job);
    updatePerformanceMetrics(queueName, 'completed', job);
  });

  queue.on('failed', (job, err) => {
    addMonitoringEvent(queueName, 'failed', job, err);
    updatePerformanceMetrics(queueName, 'failed', job);
    checkForAlerts(queueName, 'failed', err);
  });

  queue.on('stalled', (job) => {
    addMonitoringEvent(queueName, 'stalled', job);
    checkForAlerts(queueName, 'stalled');
  });

  queue.on('error', (err) => {
    addMonitoringEvent(queueName, 'error', null, err);
    checkForAlerts(queueName, 'error', err);
  });
}

async function updateQueueStatus(queue, queueName) {
  try {
    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    ] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
      queue.isPaused(),
    ]);

    monitoringData.queues[queueName] = {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused,
      lastUpdated: new Date().toISOString(),
    };

  } catch (error) {
    console.error(chalk.red(`❌ Error updating queue status for ${queueName}:`), error);
  }
}

function addMonitoringEvent(queueName, event, job, error = null) {
  const eventData = {
    queueName,
    event,
    timestamp: new Date().toISOString(),
    jobId: job?.id,
    jobName: job?.name,
    error: error?.message,
  };

  if (!monitoringData.queues[queueName]) {
    monitoringData.queues[queueName] = {};
  }

  if (!monitoringData.queues[queueName].events) {
    monitoringData.queues[queueName].events = [];
  }

  monitoringData.queues[queueName].events.push(eventData);

  // Keep only last 100 events per queue
  if (monitoringData.queues[queueName].events.length > 100) {
    monitoringData.queues[queueName].events = monitoringData.queues[queueName].events.slice(-100);
  }
}

function updatePerformanceMetrics(queueName, event, job) {
  if (!monitoringData.performance[queueName]) {
    monitoringData.performance[queueName] = {
      completed: 0,
      failed: 0,
      avgProcessingTime: 0,
      totalProcessingTime: 0,
      jobCount: 0,
    };
  }

  const metrics = monitoringData.performance[queueName];

  if (event === 'completed') {
    metrics.completed++;
    if (job.processedOn && job.timestamp) {
      const processingTime = job.processedOn - job.timestamp;
      metrics.totalProcessingTime += processingTime;
      metrics.jobCount++;
      metrics.avgProcessingTime = metrics.totalProcessingTime / metrics.jobCount;
    }
  } else if (event === 'failed') {
    metrics.failed++;
  }
}

function startPerformanceMonitoring() {
  // Monitor system performance every minute
  setInterval(() => {
    const totalJobs = Object.values(monitoringData.performance).reduce((sum, metrics) => {
      return sum + metrics.completed + metrics.failed;
    }, 0);

    const avgProcessingTime = Object.values(monitoringData.performance).reduce((sum, metrics) => {
      return sum + metrics.avgProcessingTime;
    }, 0) / Object.keys(monitoringData.performance).length || 0;

    monitoringData.performance.system = {
      totalJobs,
      avgProcessingTime,
      timestamp: new Date().toISOString(),
    };
  }, 60000);
}

function startAlertSystem() {
  // Check for alerts every 10 seconds
  setInterval(() => {
    checkQueueHealth();
    checkPerformanceAlerts();
  }, 10000);
}

function checkForAlerts(queueName, event, error = null) {
  const alert = {
    queueName,
    event,
    error: error?.message,
    timestamp: new Date().toISOString(),
    severity: 'warning',
  };

  // Determine severity based on event type
  if (event === 'failed' && error) {
    alert.severity = 'error';
  } else if (event === 'stalled') {
    alert.severity = 'warning';
  } else if (event === 'error') {
    alert.severity = 'critical';
  }

  monitoringData.alerts.push(alert);

  // Keep only last 50 alerts
  if (monitoringData.alerts.length > 50) {
    monitoringData.alerts = monitoringData.alerts.slice(-50);
  }

  // Log critical alerts
  if (alert.severity === 'critical') {
    console.log(chalk.red(`🚨 CRITICAL ALERT: ${queueName} - ${event}`));
  }
}

function checkQueueHealth() {
  Object.entries(monitoringData.queues).forEach(([queueName, status]) => {
    // Alert if too many failed jobs
    if (status.failed > 10) {
      checkForAlerts(queueName, 'high-failure-rate', new Error(`High failure rate: ${status.failed} failed jobs`));
    }

    // Alert if too many waiting jobs
    if (status.waiting > 100) {
      checkForAlerts(queueName, 'queue-backlog', new Error(`Queue backlog: ${status.waiting} waiting jobs`));
    }

    // Alert if queue is paused for too long
    if (status.paused) {
      checkForAlerts(queueName, 'queue-paused', new Error('Queue is paused'));
    }
  });
}

function checkPerformanceAlerts() {
  Object.entries(monitoringData.performance).forEach(([queueName, metrics]) => {
    // Alert if average processing time is too high
    if (metrics.avgProcessingTime > 30000) { // 30 seconds
      checkForAlerts(queueName, 'slow-processing', new Error(`Slow processing: ${Math.round(metrics.avgProcessingTime)}ms average`));
    }

    // Alert if failure rate is too high
    const totalJobs = metrics.completed + metrics.failed;
    if (totalJobs > 0 && (metrics.failed / totalJobs) > 0.2) { // 20% failure rate
      checkForAlerts(queueName, 'high-failure-rate', new Error(`High failure rate: ${Math.round((metrics.failed / totalJobs) * 100)}%`));
    }
  });
}

// Get monitoring data
function getMonitoringData() {
  return {
    ...monitoringData,
    timestamp: new Date().toISOString(),
  };
}

// Get queue status
function getQueueStatus(queueName) {
  return monitoringData.queues[queueName] || null;
}

// Get performance metrics
function getPerformanceMetrics(queueName) {
  return monitoringData.performance[queueName] || null;
}

// Get alerts
function getAlerts(severity = null) {
  if (severity) {
    return monitoringData.alerts.filter(alert => alert.severity === severity);
  }
  return monitoringData.alerts;
}

// Clear alerts
function clearAlerts() {
  monitoringData.alerts = [];
}

// Get system health summary
function getSystemHealth() {
  const queues = Object.keys(monitoringData.queues);
  const totalWaiting = Object.values(monitoringData.queues).reduce((sum, status) => sum + status.waiting, 0);
  const totalActive = Object.values(monitoringData.queues).reduce((sum, status) => sum + status.active, 0);
  const totalFailed = Object.values(monitoringData.queues).reduce((sum, status) => sum + status.failed, 0);
  const criticalAlerts = monitoringData.alerts.filter(alert => alert.severity === 'critical').length;

  return {
    status: criticalAlerts > 0 ? 'critical' : totalFailed > 10 ? 'warning' : 'healthy',
    queues: queues.length,
    totalWaiting,
    totalActive,
    totalFailed,
    criticalAlerts,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  setupMonitor,
  getMonitoringData,
  getQueueStatus,
  getPerformanceMetrics,
  getAlerts,
  clearAlerts,
  getSystemHealth,
};
