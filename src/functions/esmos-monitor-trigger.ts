import { app, InvocationContext, Timer } from "@azure/functions";
import { ComputeManagementClient } from "@azure/arm-compute";
import { ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { DefaultAzureCredential } from "@azure/identity";
import logger from "../lib/pino";
import initSentry from "../lib/sentry";
import dotenv from "dotenv";

dotenv.config();

/*
This Azure Function is triggered every 10 minutes by a timer.
It checks the status of a the ESMOS production deployment and triggers a container app job if the VM is running.
*/

export async function checkVmAndRunTests(myTimer: Timer, context: InvocationContext): Promise<void> {
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID!;
  const vmResourceGroup = process.env.AZURE_VM_RESOURCE_GROUP!;
  const acaResourceGroup = process.env.AZURE_ACA_RESOURCE_GROUP!;
  const vmName = process.env.AZURE_VM_NAME!;
  const jobName = process.env.AZURE_ACA_JOB_NAME!;

  const credential = new DefaultAzureCredential();
  const computeClient = new ComputeManagementClient(credential, subscriptionId);
  const caClient = new ContainerAppsAPIClient(credential, subscriptionId);

  context.info(myTimer)

  try {
    const instanceView = await computeClient.virtualMachines.instanceView(vmResourceGroup, vmName);
    const powerState = instanceView.statuses?.find(s => s.code?.startsWith('PowerState/'));

    context.info(`VM Status: ${powerState?.displayStatus}`);
    logger.info(`VM Status: ${powerState?.displayStatus}`);

    if (powerState?.code === 'PowerState/running') {
      context.info("VM is running. Triggering Container App Job...");
      logger.info("VM is running. Triggering Container App Job...");

      await caClient.jobs.beginStart(acaResourceGroup, jobName)
      context.info("Job successfully triggered.");
      logger.info('Job successfully triggered.');
    } else {
      context.info("VM is NOT running. Skipping execution.");
      logger.info('VM is not running. Skipping execution.');
    }
  } catch (error) {
    const sentry = initSentry();
    sentry.captureException(error);
    context.error("Error in automation:", error);
    logger.error(error, "Error in automation");
  }
}

app.timer('CheckVmAndTriggerJob', {
  schedule: '0 */10 * * * *',
  handler: checkVmAndRunTests
});