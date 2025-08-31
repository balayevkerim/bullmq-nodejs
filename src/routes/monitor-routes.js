const express = require('express');
const { 
  getMonitoringData, 
  getQueueStatus, 
  getPerformanceMetrics, 
  getAlerts, 
  clearAlerts, 
  getSystemHealth 
} = require('../monitor/setup');
const { getRecurringJobs } = require('../scheduler/setup');
const router = express.Router();

// Get overall monitoring dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const monitoringData = getMonitoringData();
    const systemHealth = getSystemHealth();
    const recurringJobs = await getRecurringJobs();

    res.json({
      success: true,
      data: {
        systemHealth,
        queues: monitoringData.queues,
        performance: monitoringData.performance,
        alerts: monitoringData.alerts.slice(-10), // Last 10 alerts
        recurringJobs: recurringJobs.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get system health summary
router.get('/health', async (req, res) => {
  try {
    const health = getSystemHealth();

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all queue statuses
router.get('/queues', async (req, res) => {
  try {
    const monitoringData = getMonitoringData();

    res.json({
      success: true,
      data: {
        queues: monitoringData.queues,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get specific queue status
router.get('/queues/:queueName', async (req, res) => {
  try {
    const { queueName } = req.params;
    const status = getQueueStatus(queueName);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`,
      });
    }

    res.json({
      success: true,
      data: {
        queueName,
        status,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { queueName } = req.query;
    const monitoringData = getMonitoringData();

    if (queueName) {
      const metrics = getPerformanceMetrics(queueName);
      if (!metrics) {
        return res.status(404).json({
          success: false,
          error: `Performance metrics for queue '${queueName}' not found`,
        });
      }

      res.json({
        success: true,
        data: {
          queueName,
          metrics,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          performance: monitoringData.performance,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get alerts
router.get('/alerts', async (req, res) => {
  try {
    const { severity, limit = 50 } = req.query;
    const alerts = getAlerts(severity);

    res.json({
      success: true,
      data: {
        alerts: alerts.slice(-parseInt(limit)),
        total: alerts.length,
        severity,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Clear alerts
router.delete('/alerts', async (req, res) => {
  try {
    clearAlerts();

    res.json({
      success: true,
      message: 'All alerts cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get recurring jobs status
router.get('/recurring', async (req, res) => {
  try {
    const recurringJobs = await getRecurringJobs();

    res.json({
      success: true,
      data: {
        recurringJobs,
        count: recurringJobs.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get queue events
router.get('/events', async (req, res) => {
  try {
    const { queueName, limit = 100 } = req.query;
    const monitoringData = getMonitoringData();

    if (queueName) {
      const queueEvents = monitoringData.queues[queueName]?.events || [];
      
      res.json({
        success: true,
        data: {
          queueName,
          events: queueEvents.slice(-parseInt(limit)),
          total: queueEvents.length,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Get events from all queues
      const allEvents = [];
      Object.entries(monitoringData.queues).forEach(([name, queueData]) => {
        if (queueData.events) {
          queueData.events.forEach(event => {
            allEvents.push({
              ...event,
              queueName: name,
            });
          });
        }
      });

      // Sort by timestamp
      allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      res.json({
        success: true,
        data: {
          events: allEvents.slice(0, parseInt(limit)),
          total: allEvents.length,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const monitoringData = getMonitoringData();
    const systemHealth = getSystemHealth();

    // Calculate additional statistics
    const totalQueues = Object.keys(monitoringData.queues).length;
    const totalJobs = Object.values(monitoringData.queues).reduce((sum, status) => {
      return sum + status.waiting + status.active + status.completed + status.failed + status.delayed;
    }, 0);

    const avgProcessingTime = Object.values(monitoringData.performance).reduce((sum, metrics) => {
      return sum + (metrics.avgProcessingTime || 0);
    }, 0) / Object.keys(monitoringData.performance).length || 0;

    const stats = {
      system: {
        status: systemHealth.status,
        totalQueues,
        totalJobs,
        avgProcessingTime: Math.round(avgProcessingTime),
        criticalAlerts: systemHealth.criticalAlerts,
      },
      queues: {
        total: totalQueues,
        active: Object.values(monitoringData.queues).filter(q => q.active > 0).length,
        paused: Object.values(monitoringData.queues).filter(q => q.paused).length,
      },
      jobs: {
        waiting: Object.values(monitoringData.queues).reduce((sum, status) => sum + status.waiting, 0),
        active: Object.values(monitoringData.queues).reduce((sum, status) => sum + status.active, 0),
        completed: Object.values(monitoringData.queues).reduce((sum, status) => sum + status.completed, 0),
        failed: Object.values(monitoringData.queues).reduce((sum, status) => sum + status.failed, 0),
        delayed: Object.values(monitoringData.queues).reduce((sum, status) => sum + status.delayed, 0),
      },
      performance: {
        totalCompleted: Object.values(monitoringData.performance).reduce((sum, metrics) => sum + metrics.completed, 0),
        totalFailed: Object.values(monitoringData.performance).reduce((sum, metrics) => sum + metrics.failed, 0),
        avgProcessingTime: Math.round(avgProcessingTime),
      },
      alerts: {
        total: monitoringData.alerts.length,
        critical: monitoringData.alerts.filter(a => a.severity === 'critical').length,
        error: monitoringData.alerts.filter(a => a.severity === 'error').length,
        warning: monitoringData.alerts.filter(a => a.severity === 'warning').length,
      },
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get real-time metrics (for WebSocket-like updates)
router.get('/realtime', async (req, res) => {
  try {
    const monitoringData = getMonitoringData();
    const systemHealth = getSystemHealth();

    // Set headers for real-time updates
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'application/json');

    res.json({
      success: true,
      data: {
        systemHealth,
        queueSummary: Object.entries(monitoringData.queues).map(([name, status]) => ({
          name,
          waiting: status.waiting,
          active: status.active,
          completed: status.completed,
          failed: status.failed,
          delayed: status.delayed,
          paused: status.paused,
        })),
        recentAlerts: monitoringData.alerts.slice(-5),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get queue comparison
router.get('/comparison', async (req, res) => {
  try {
    const monitoringData = getMonitoringData();

    const comparison = Object.entries(monitoringData.queues).map(([name, status]) => ({
      name,
      metrics: {
        waiting: status.waiting,
        active: status.active,
        completed: status.completed,
        failed: status.failed,
        delayed: status.delayed,
        total: status.waiting + status.active + status.completed + status.failed + status.delayed,
      },
      performance: monitoringData.performance[name] || {
        completed: 0,
        failed: 0,
        avgProcessingTime: 0,
      },
      health: {
        status: status.failed > 10 ? 'warning' : status.failed > 0 ? 'degraded' : 'healthy',
        failureRate: status.completed + status.failed > 0 ? (status.failed / (status.completed + status.failed)) * 100 : 0,
      },
    }));

    res.json({
      success: true,
      data: {
        comparison,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
