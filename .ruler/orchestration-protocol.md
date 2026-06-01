# ORCHESTRATION & DISPATCH PROTOCOL

- EXPLICIT AUTHORIZATION OVERRIDE: Whenever a prompt requests that the Orchestrator "ask for permission", "wait for approval", or similar phrases, the agent MUST halt all execution immediately after the setup phase (e.g., creating Kanban tasks in the backlog).
- ANTI-AUTO-START: The agent is strictly forbidden from running `kanban task start` or dispatching agents in the same response as the task creation unless the user has explicitly said "Approved", "Start", or "Dispatch" in the current turn.
- DIRECTIVES RULE: Immediate, contextual directives in the prompt ALWAYS supersede general background guidelines regarding "proactivity".