# Vibe Coding Lab Collaboration Rules

These rules apply to every project in this repository.

## Project Purpose

- Each lightweight project should solve a real problem from the user's work or
  daily life, improve a recurring workflow, or turn a genuine personal interest
  into a useful tool.
- A project may be built from scratch or adapted from open source. Choose the
  path that produces the clearest, lightest, and most maintainable result.
- Keep the scope focused enough to reach a usable, presentable MVP in one
  concentrated Codex implementation cycle. Split larger ideas before building.

## Project Selection

- Evaluate ideas by personal relevance, frequency of use, clarity of the core
  workflow, demo value, differentiation from existing projects, development
  weight, maintenance burden, privacy risk, and deployability.
- When considering open source, verify the license, recent maintenance,
  architecture weight, dependency burden, modification difficulty, and whether
  the useful parts can be isolated without inheriting unnecessary complexity.
- During broad ideation, present a larger set of candidates using only a
  product name and a brief description. Let the user identify interesting
  directions before spending time on detailed comparisons.
- After the user shortlists a direction, give a clear recommendation and ask
  the user to make only the direction-level choice.
- Do not select ideas that substantially repeat an existing project in this
  repository unless the new project has a clearly different user problem.

## Default Delivery

- Add new projects as top-level folders in `vibe-coding-lab`; do not create a
  standalone repository unless the user explicitly requests one.
- Prefer a lightweight Web application when it can solve the problem. Use a
  native application only when operating-system integration is essential.
- Build the actual usable workflow first. Avoid unnecessary accounts, backends,
  databases, AI APIs, or heavy frameworks.
- Every finished project should include a polished usable interface, sensible
  validation and edge states, risk-appropriate tests, a user-oriented README,
  and a clear statement of capability boundaries.
- Update the repository README, project index, showcase page, deployment
  workflow, and relevant links when adding a project.
- For Web projects, verify the production build, desktop and mobile layouts,
  core interactions, resource loading, and deployed URL before completion.
- Once the user has chosen a project and asked to start, complete implementation,
  testing, documentation, commit, push, and deployment as one end-to-end task.

## User Involvement

- Codex should work autonomously and bundle routine decisions instead of asking
  for repeated confirmation.
- Ask the user only when a decision materially changes the product direction,
  an irreversible or externally risky action is required, credentials or paid
  services are needed, or missing information cannot be inferred safely.
- Do not interrupt for routine choices such as file structure, component names,
  minor visual details, test organization, or implementation mechanics.
- At a direction checkpoint, explain the options, trade-offs, and recommendation
  concisely so the user can answer with one choice.

## Open-Source Adaptation

- Preserve required licenses, notices, and attribution.
- Keep the original project only when its architecture genuinely saves time.
  Otherwise reuse a small library or build the focused workflow from scratch.
- Document what was reused, what was changed, and why the chosen foundation was
  appropriate for a lightweight project.
