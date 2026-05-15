require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Worker, NativeConnection } = require('@temporalio/worker');
const activities = require('../activities/onboardingActivities');

async function runWorker() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       OnboardFlow Temporal Worker        ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'onboarding-queue',
    workflowsPath: require.resolve('../workflows/onboardingWorkflow'),
    activities,
    maxConcurrentActivityTaskExecutions: 10,
    maxConcurrentWorkflowTaskExecutions: 5,
  });

  console.log(`✅ Worker connected to Temporal at ${process.env.TEMPORAL_ADDRESS || 'localhost:7233'}`);
  console.log(`📋 Task Queue: ${process.env.TEMPORAL_TASK_QUEUE || 'onboarding-queue'}`);
  console.log(`🌐 Namespace: ${process.env.TEMPORAL_NAMESPACE || 'default'}`);
  console.log('');
  console.log('🔄 Polling for tasks...');
  console.log('');

  await worker.run();
}

runWorker().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});
