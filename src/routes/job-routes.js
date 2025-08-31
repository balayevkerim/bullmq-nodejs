const express = require('express');
const { getQueue } = require('../queues/setup');
const router = express.Router();

// Get all jobs from a queue
router.get('/:queueName', async (req, res) => {
  try {
    const { queueName } = req.params;
    const { status = 'waiting', limit = 50, offset = 0 } = req.query;
    const queue = getQueue(queueName);

    if (!queue) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`,
      });
    }

    let jobs = [];
    let total = 0;

    switch (status) {
      case 'waiting':
        jobs = await queue.getWaiting(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        break;
      case 'active':
        jobs = await queue.getActive(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        break;
      case 'completed':
        jobs = await queue.getCompleted(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        break;
      case 'failed':
        jobs = await queue.getFailed(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        break;
      case 'delayed':
        jobs = await queue.getDelayed(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Use: waiting, active, completed, failed, delayed',
        });
    }

    // Get total count
    const allJobs = await queue.getJobs([status]);
    total = allJobs.length;

    const jobData = jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      opts: job.opts,
      progress: job.progress,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      delay: job.delay,
      priority: job.opts.priority,
    }));

    res.json({
      success: true,
      data: {
        jobs: jobData,
        pagination: {
          status,
          limit: parseInt(limit),
          offset: parseInt(offset),
          total,
          hasMore: offset + limit < total,
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

// Get specific job details
router.get('/:queueName/:jobId', async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    const queue = getQueue(queueName);

    if (!queue) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`,
      });
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job '${jobId}' not found in queue '${queueName}'`,
      });
    }

    const jobState = await job.getState();
    const logs = await job.logs();

    res.json({
      success: true,
      data: {
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        progress: job.progress,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        delay: job.delay,
        priority: job.opts.priority,
        state: jobState,
        logs: logs.logs || [],
        returnvalue: job.returnvalue,
        stacktrace: job.stacktrace,
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

// Retry failed job
router.post('/:queueName/:jobId/retry', async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    const queue = getQueue(queueName);

    if (!queue) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`,
      });
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job '${jobId}' not found in queue '${queueName}'`,
      });
    }

    const jobState = await job.getState();

    if (jobState !== 'failed') {
      return res.status(400).json({
        success: false,
        error: `Job is not in failed state. Current state: ${jobState}`,
      });
    }

    await job.retry();

    res.json({
      success: true,
      message: `Job '${jobId}' retried successfully`,
      data: {
        jobId,
        queue: queueName,
        newState: 'waiting',
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

// Remove job
router.delete('/:queueName/:jobId', async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    const queue = getQueue(queueName);

    if (!queue) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`,
      });
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job '${jobId}' not found in queue '${queueName}'`,
      });
    }

    await job.remove();

    res.json({
      success: true,
      message: `Job '${jobId}' removed successfully`,
      data: {
        jobId,
        queue: queueName,
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

// Promote delayed job to active
router.post('/:queueName/:jobId/promote', async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    const queue = getQueue(queueName);

    if (!queue) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`,
      });
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job '${jobId}' not found in queue '${queueName}'`,
      });
    }

    const jobState = await job.getState();

    if (jobState !== 'delayed') {
      return res.status(400).json({
        success: false,
        error: `Job is not in delayed state. Current state: ${jobState}`,
      });
    }

    await job.promote();

    res.json({
      success: true,
      message: `Job '${jobId}' promoted successfully`,
      data: {
        jobId,
        queue: queueName,
        newState: 'waiting',
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

// Update job progress
router.patch('/:queueName/:jobId/progress', async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    const { progress } = req.body;
    const queue = getQueue(queueName);

    if (!queue) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`,
      });
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job '${jobId}' not found in queue '${queueName}'`,
      });
    }

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: 'Progress must be a number between 0 and 100',
      });
    }

    await job.updateProgress(progress);

    res.json({
      success: true,
      message: `Job '${jobId}' progress updated to ${progress}%`,
      data: {
        jobId,
        queue: queueName,
        progress,
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

// Get job logs
router.get('/:queueName/:jobId/logs', async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    const { start = 0, end = -1 } = req.query;
    const queue = getQueue(queueName);

    if (!queue) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`,
      });
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job '${jobId}' not found in queue '${queueName}'`,
      });
    }

    const logs = await job.logs(parseInt(start), parseInt(end));

    res.json({
      success: true,
      data: {
        jobId,
        queue: queueName,
        logs: logs.logs || [],
        count: logs.count || 0,
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

// Add log to job
router.post('/:queueName/:jobId/logs', async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    const { message } = req.body;
    const queue = getQueue(queueName);

    if (!queue) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`,
      });
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job '${jobId}' not found in queue '${queueName}'`,
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    await job.log(message);

    res.json({
      success: true,
      message: `Log added to job '${jobId}'`,
      data: {
        jobId,
        queue: queueName,
        logMessage: message,
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

// Get job statistics
router.get('/:queueName/:jobId/stats', async (req, res) => {
  try {
    const { queueName, jobId } = req.params;
    const queue = getQueue(queueName);

    if (!queue) {
      return res.status(404).json({
        success: false,
        error: `Queue '${queueName}' not found`,
      });
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job '${jobId}' not found in queue '${queueName}'`,
      });
    }

    const jobState = await job.getState();
    const logs = await job.logs();

    const stats = {
      id: job.id,
      name: job.name,
      state: jobState,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      delay: job.delay,
      priority: job.opts.priority,
      logCount: logs.count || 0,
      processingTime: job.processedOn && job.timestamp ? job.processedOn - job.timestamp : null,
      totalTime: job.finishedOn && job.timestamp ? job.finishedOn - job.timestamp : null,
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

module.exports = router;
