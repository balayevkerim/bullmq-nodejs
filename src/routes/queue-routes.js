const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getQueue } = require('../queues/setup');
const router = express.Router();

// Get all queues status
router.get('/', async (req, res) => {
  try {
    const { getQueues } = require('../queues/setup');
    const queues = getQueues();
    
    const queueStatus = {};
    
    for (const [name, queue] of Object.entries(queues)) {
      if (queue) {
        const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(),
          queue.getCompleted(),
          queue.getFailed(),
          queue.getDelayed(),
          queue.isPaused(),
        ]);

        queueStatus[name] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
          paused,
          name: queue.name,
        };
      }
    }

    res.json({
      success: true,
      data: queueStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get specific queue status
router.get('/:queueName', async (req, res) => {
  try {
    const { queueName } = req.params;
    const queue = getQueue(queueName);

    if (!queue) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`,
      });
    }

    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
      queue.isPaused(),
    ]);

    res.json({
      success: true,
      data: {
        name: queue.name,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused,
        jobs: {
          waiting: waiting.slice(0, 10), // Limit to 10 jobs
          active: active.slice(0, 10),
          failed: failed.slice(0, 10),
          delayed: delayed.slice(0, 10),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add job to email queue
router.post('/email/add', async (req, res) => {
  try {
    const { recipient, subject, body, priority = 0 } = req.body;
    const queue = getQueue('email');

    if (!recipient || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Recipient and subject are required',
      });
    }

    const job = await queue.add('send-email', {
      recipient,
      subject,
      body: body || 'Default email body',
      timestamp: new Date().toISOString(),
    }, {
      priority,
      jobId: uuidv4(),
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        queue: 'email',
        status: 'queued',
        priority,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add job to image processing queue
router.post('/image-processing/add', async (req, res) => {
  try {
    const { imageUrl, operations = ['resize', 'compress'], priority = 0 } = req.body;
    const queue = getQueue('image-processing');

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Image URL is required',
      });
    }

    const job = await queue.add('process-image', {
      imageUrl,
      operations,
      timestamp: new Date().toISOString(),
    }, {
      priority,
      jobId: uuidv4(),
      timeout: 30000, // 30 seconds timeout
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        queue: 'image-processing',
        status: 'queued',
        operations,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add priority job
router.post('/priority/add', async (req, res) => {
  try {
    const { task, priority = 0, description } = req.body;
    const queue = getQueue('priority');

    if (!task) {
      return res.status(400).json({
        success: false,
        error: 'Task is required',
      });
    }

    const job = await queue.add('priority-task', {
      task,
      priority,
      description: description || 'Priority task',
      timestamp: new Date().toISOString(),
    }, {
      priority,
      jobId: uuidv4(),
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        queue: 'priority',
        status: 'queued',
        priority,
        task,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add delayed job
router.post('/delayed/add', async (req, res) => {
  try {
    const { message, delay = 5000, scheduledFor } = req.body;
    const queue = getQueue('delayed');

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const job = await queue.add('delayed-task', {
      message,
      scheduledFor: scheduledFor || new Date(Date.now() + delay).toISOString(),
      timestamp: new Date().toISOString(),
    }, {
      delay: parseInt(delay),
      jobId: uuidv4(),
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        queue: 'delayed',
        status: 'scheduled',
        delay: parseInt(delay),
        scheduledFor: new Date(Date.now() + parseInt(delay)).toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add dependency job
router.post('/dependency/add', async (req, res) => {
  try {
    const { task, dependencies = [], description } = req.body;
    const queue = getQueue('dependency');

    if (!task) {
      return res.status(400).json({
        success: false,
        error: 'Task is required',
      });
    }

    const job = await queue.add('dependency-task', {
      task,
      dependencies,
      description: description || 'Task with dependencies',
      timestamp: new Date().toISOString(),
    }, {
      jobId: uuidv4(),
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        queue: 'dependency',
        status: 'queued',
        dependencies: dependencies.length,
        task,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add rate limited job
router.post('/rate-limited/add', async (req, res) => {
  try {
    const { apiCall, rateLimit = 1000 } = req.body;
    const queue = getQueue('rate-limited');

    if (!apiCall) {
      return res.status(400).json({
        success: false,
        error: 'API call is required',
      });
    }

    const job = await queue.add('rate-limited-api-call', {
      apiCall,
      rateLimit: parseInt(rateLimit),
      timestamp: new Date().toISOString(),
    }, {
      jobId: uuidv4(),
      delay: Math.random() * parseInt(rateLimit), // Random delay within rate limit
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        queue: 'rate-limited',
        status: 'queued',
        rateLimit: parseInt(rateLimit),
        apiCall,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Pause/Resume queue
router.post('/:queueName/:action', async (req, res) => {
  try {
    const { queueName, action } = req.params;
    const queue = getQueue(queueName);

    if (!queue) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`,
      });
    }

    if (action === 'pause') {
      await queue.pause();
      res.json({
        success: true,
        message: `Queue '${queueName}' paused`,
        timestamp: new Date().toISOString(),
      });
    } else if (action === 'resume') {
      await queue.resume();
      res.json({
        success: true,
        message: `Queue '${queueName}' resumed`,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid action. Use "pause" or "resume"',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Clean queue (remove all jobs)
router.delete('/:queueName/clean', async (req, res) => {
  try {
    const { queueName } = req.params;
    const queue = getQueue(queueName);

    if (!queue) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`,
      });
    }

    await queue.clean(0, 'active');
    await queue.clean(0, 'wait');
    await queue.clean(0, 'delayed');
    await queue.clean(0, 'failed');

    res.json({
      success: true,
      message: `Queue '${queueName}' cleaned`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
