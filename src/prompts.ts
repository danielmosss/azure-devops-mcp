// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CORE_TOOLS } from "./tools/core.js";
import { WORKITEM_TOOLS } from "./tools/work-items.js";
import { REPO_TOOLS } from "./tools/repositories.js";

function configurePrompts(server: McpServer) {
  server.prompt("Projects", "Lists all projects in the Azure DevOps organization.", {}, () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: String.raw`
# Task
Use the '${CORE_TOOLS.list_projects}' tool to retrieve all 'wellFormed' projects in the current Azure DevOps organization.
Present the results in alphabetical order in a table with the following columns: Name and ID.`,
        },
      },
    ],
  }));

  server.prompt("Teams", "Retrieves all teams for a given Azure DevOps project.", { project: z.string() }, ({ project }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: String.raw`
  # Task
  Use the '${CORE_TOOLS.list_project_teams}' tool to retrieve all teams for the project '${project}'.
  Present the results in alphabetical order in a table with the following columns: Name and Id`,
        },
      },
    ],
  }));

  server.prompt(
    "getWorkItem",
    "Retrieves details for a specific Azure DevOps work item by ID.",
    { id: z.string().describe("The ID of the work item to retrieve."), project: z.string().describe("The name or ID of the Azure DevOps project.") },
    ({ id, project }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: String.raw`
  # Task
  Use the '${WORKITEM_TOOLS.get_work_item}' tool to retrieve details for the work item with ID '${id}' in project '${project}'.
  Present the following fields: ID, Title, State, Assigned To, Work Item Type, Description or Repro Steps, and Created Date.`,
          },
        },
      ],
    })
  );

  server.prompt(
    "checkChangesVsDevCodeList",
    "Prompt to review all changes in the current branch versus the main development branch, ensuring compliance with the developer code checklist (DCL).",
    {
      targetBranch: z.string().optional().describe("The target branch to compare against (usually 'main' or 'master'). Defaults to 'master' if not specified.")
    },
    ({ targetBranch }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: String.raw`
# Check Changes vs Dev Code List

## Purpose
Ensure all code changes in the current branch are properly documented and compliant with the developer code checklist (DCL).

## Step-by-Step Instructions

### 1. Discover Repository Information
First, determine the current repository context:
- Get the current branch: \`git rev-parse --abbrev-ref HEAD\`
- Get the current project and repo: \`git config --get remote.origin.url\` (format: https://org@dev.azure.com/org/{project}/_git/{repoName})
- Parse the URL to extract the project name and repository name
- Use \`${REPO_TOOLS.list_repos_by_project}\` with the project name and repoNameFilter to get the repositoryId

### 2. Identify Changes
- Use the '${REPO_TOOLS.get_current_branch_changes}' tool with the discovered project, repositoryId, currentBranch, and targetBranch '${targetBranch || "master"}' to get all file changes.
- Check if there's an active pull request for this branch using '${REPO_TOOLS.list_pull_requests_by_repo}' with the discovered repositoryId and sourceRefName 'refs/heads/{currentBranch}'. IF there is no pull request, tell the user to first create one, this can be done with the command /createPullrequestToMaster. Abort further processing.
- For each change, specify the file name and change type (Added, Modified, Deleted, Renamed).

### 3. Check Documentation & Compliance
- Check if each change follows the developer code checklist requirements. [developer code checklist](..\.github\instructions\copilot-instructions.md)
- If a change is not documented or does not follow the checklist, add a clear note to flag it for review.

### 4. Summarize Findings
- Summarize all changes and if they follow the developer checklist rules.

## Best Practices
- Be concise and accurate in your reporting.
- Use clear notes for any undocumented or non-compliant changes.
- Always suggest actionable next steps for compliance.`,
          },
        },
      ],
    })
  );
}

export { configurePrompts };
