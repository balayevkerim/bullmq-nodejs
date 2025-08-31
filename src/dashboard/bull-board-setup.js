const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { getQueues } = require('../queues/setup');
const chalk = require('chalk');

let serverAdapter;
let bullBoard;

function setupBullBoard() {
  try {
    console.log(chalk.blue('📊 Setting up Bull Board dashboard...'));

    // Create Express adapter for Bull Board
    serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    // Get all queues from our setup
    const queues = getQueues();
    
    // Create adapters for each queue
    const queueAdapters = Object.entries(queues).map(([name, queue]) => {
      if (queue) {
        return new BullMQAdapter(queue);
      }
      return null;
    }).filter(Boolean);

    // Create Bull Board instance
    bullBoard = createBullBoard({
      queues: queueAdapters,
      serverAdapter: serverAdapter,
    });

    console.log(chalk.green('✅ Bull Board dashboard setup successfully!'));
    console.log(chalk.cyan(`📊 Dashboard available at: http://localhost:3000/admin/queues`));

    return serverAdapter.getRouter();

  } catch (error) {
    console.error(chalk.red('❌ Error setting up Bull Board:'), error);
    throw error;
  }
}

function addQueueToDashboard(queue, name) {
  try {
    if (bullBoard && queue) {
      const adapter = new BullMQAdapter(queue);
      bullBoard.addQueue(adapter);
      console.log(chalk.green(`✅ Added queue '${name}' to Bull Board dashboard`));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error adding queue '${name}' to dashboard:`), error);
  }
}

function removeQueueFromDashboard(queueName) {
  try {
    if (bullBoard) {
      bullBoard.removeQueue(queueName);
      console.log(chalk.yellow(`🗑️ Removed queue '${queueName}' from Bull Board dashboard`));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error removing queue '${queueName}' from dashboard:`), error);
  }
}

function getBullBoardStats() {
  try {
    if (bullBoard) {
      return {
        queues: bullBoard.queues.length,
        isActive: !!bullBoard,
        basePath: '/admin/queues',
      };
    }
    return {
      queues: 0,
      isActive: false,
      basePath: null,
    };
  } catch (error) {
    console.error(chalk.red('❌ Error getting Bull Board stats:'), error);
    return {
      queues: 0,
      isActive: false,
      basePath: null,
      error: error.message,
    };
  }
}

module.exports = {
  setupBullBoard,
  addQueueToDashboard,
  removeQueueFromDashboard,
  getBullBoardStats,
};
