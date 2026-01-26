# Initialize Worktree with Sparse Checkout

Create a new git worktree for an agent to work in isolation, with only the specified directory checked out.

## Variables

worktree_name: $1
target_directory: $2

## Instructions

1. Create a new git worktree in the `trees/<worktree_name>` directory with sparse checkout
2. Configure sparse checkout to include `<target_directory>` and `.claude/` directory
3. Base the worktree on the main branch
4. Copy the `.env` file from the root directory to the worktree (if it exists)
5. Create an initial commit in the worktree to establish the branch
6. Report the successful creation of the worktree

## Git Worktree Setup with Sparse Checkout

Execute these steps in order:

1. **Create the trees directory** if it doesn't exist:
   ```bash
   mkdir -p trees
   ```

2. **Check if worktree already exists**:
   - If `trees/<worktree_name>` already exists, report that it exists and stop
   - Otherwise, proceed with creation

3. **Create the git worktree without checkout**:
   ```bash
   git worktree add --no-checkout trees/<worktree_name> -b <worktree_name>
   ```

4. **Configure sparse checkout for the target directory and .claude/**:
   ```bash
   cd trees/<worktree_name>

   # Initialize sparse checkout
   git sparse-checkout init --cone

   # Set sparse checkout to include target directory and .claude/ (for slash commands)
   git sparse-checkout set <target_directory> .claude

   # Now checkout the files
   git checkout
   ```

5. **Copy environment file** (if exists):
   - Check if `.env` exists in the project root
   - If it exists, copy it to `trees/<worktree_name>/<target_directory>/.env`
   - If it doesn't exist, continue without error (it's optional)

6. **Create initial commit with no changes**:
   ```bash
   git commit --allow-empty -m "Initial worktree setup for <worktree_name> with sparse checkout of <target_directory>"
   ```

## Error Handling

- If the worktree already exists, report this and exit gracefully
- If git worktree creation fails, report the error
- If sparse-checkout configuration fails, report the error
- If `.env` doesn't exist in root or target directory, continue without error (it's optional)

## Verification

After setup, verify the sparse checkout is working:
```bash
cd trees/<worktree_name>
ls -la  # Should show <target_directory> and .claude directories (plus .git)
git sparse-checkout list  # Should show: .claude and <target_directory>
```

## Report

Report one of the following:
- Success: "Worktree '<worktree_name>' created successfully at trees/<worktree_name> with <target_directory> and .claude checked out"
- Already exists: "Worktree '<worktree_name>' already exists at trees/<worktree_name>"
- Error: "Failed to create worktree: <error message>"

## Notes

- Git worktrees with sparse checkout provide double isolation:
  - **Worktree isolation**: Separate branch and working directory
  - **Sparse checkout**: Only the relevant directories are present
- This reduces clutter and prevents accidental modifications to other apps
- The agent works with `<target_directory>` and has access to `.claude/` for slash commands
- Full repository history is still available but only specified directories are in the working tree
- Each worktree maintains its own sparse-checkout configuration
