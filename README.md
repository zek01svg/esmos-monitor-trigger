# ⚡ ESMOS Monitor Trigger

## ℹ️ Overview

This repository contains the **Trigger Logic** for the **ESMOS Monitor** system. It is a lightweight **Azure Function (Timer Trigger)** designed to optimize costs and resources by ensuring the monitoring job only runs when the target application infrastructure is active.

The core responsibility of this function is to:

1.  Wake up on a schedule (every 10 minutes).
2.  Check the **Power State** of the target Azure Virtual Machine (hosting ESMOS).
3.  **Conditionally Trigger** the main [ESMOS Monitor](https://github.com/zek01svg/esmos-monitor) Container App Job only if the VM is valid and running.

## 🏗️ Architecture

To optimize costs and performance, the architecture decouples the scheduling logic from the heavy test execution:

1.  **Trigger (This Repo)**: A lightweight Node.js Azure Function.
    - **Cost-Efficient**: Runs on a Consumption plan, incurring negligible cost.
    - **Smart Logic**: Prevents "zombie runs" where the test suite would fail simply because the target environment is offline.

2.  **Execution (Separate Repo)**: The actual Playwright test suite runs as an **Azure Container App Job**.
    - It is set to `Manual` trigger mode.
    - It is invoked exclusively by this function via the Azure SDK.

## ✨ Features

- **Cron Schedule**: Runs automatically every 10 minutes.
- **Infrastructure Awareness**: Queries Azure Compute API to check real-time VM status.
- **Conditional Execution**: Triggers the heavy-lifting container job _only_ when the target is `PowerState/running`.
- **Telemetry & Logging**: Integrated with **Better Stack Logs** and **Better Stack Errors** (via Pino and Sentry) for audit trails of when checks occurred and if execution was skipped.
- **Secure Access**: Uses `DefaultAzureCredential` (Managed Identity) to securely authenticate with Azure resources without checking in secrets.

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (Azure Functions v4)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **SDKs**:
    - `@azure/functions`
    - `@azure/arm-compute` (for VM checks)
    - `@azure/arm-appcontainers` (for Job triggering)
    - `@azure/identity` (for authentication)
- **Logging**: [Pino](https://getpino.io/) logs to [Better Stack Logs](https://betterstack.com/log-management).
- **Error Tracking**: [Sentry SDK](https://sentry.io/) sends errors to [Better Stack Errors](https://betterstack.com/error-tracking).

## ✅ Prerequisites

- **Node.js**: v20 or higher.
- **pnpm**: v10+ (Corepack enabled).
- **Azure CLI**: For local auth and deployment.
- **Azurite**: For local storage emulation (required for Timer Triggers).

## 📦 Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/zek01svg/esmos-monitor-trigger.git
    cd esmos-monitor-trigger
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

## ⚙️ Configuration

Create a `local.settings.json` file in the root for local development:

```json
{
    "IsEncrypted": false,
    "Values": {
        "AzureWebJobsStorage": "UseDevelopmentStorage=true",
        "FUNCTIONS_WORKER_RUNTIME": "node",

        "AZURE_SUBSCRIPTION_ID": "<your-subscription-id>",
        "AZURE_VM_RESOURCE_GROUP": "<vm-resource-group>",
        "AZURE_ACA_RESOURCE_GROUP": "<aca-job-resource-group>",
        "AZURE_VM_NAME": "<target-vm-name>",
        "ACA_JOB_NAME": "<aca-job-name>",
        "CONTAINER_IMAGE_URL": "<full-image-url>",

        "BETTER_STACK_ERROR_DSN": "<optional>",
        "BETTER_STACK_ERROR_TOKEN": "<optional>",
        "BETTER_STACK_LOGS_DSN": "<optional>",
        "BETTER_STACK_LOGS_TOKEN": "<optional>"
    }
}
```

## 🚀 Usage

### Local Development

1.  **Start Azurite** (Storage Emulator):

    ```bash
    # In a separate terminal
    azurite --location ./.azurite --debug ./.azurite/debug.log
    ```

2.  **Run the Function**:

    ```bash
    pnpm start
    ```

3.  **Manually Trigger**:
    Since it's a timer, you can force it to run via HTTP POST:
    ```bash
    curl -X POST -H "Content-Type: application/json" -d "{}" http://localhost:7071/admin/functions/CheckVmAndTriggerJob
    ```

## 🚀 CI/CD

Deployment is handled via GitHub Actions to deploy this Function App to Azure.

- **Build**: Compiles TypeScript to `dist/`.
- **Deploy**: Deploys the artifacts to the Azure Function App.
