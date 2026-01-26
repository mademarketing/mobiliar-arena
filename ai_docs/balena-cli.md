# Balena CLI Reference Documentation

**Version:** v23.2.30

## Overview

The balena CLI (Command-Line Interface) is a powerful tool for interacting with the balenaCloud and the openBalena open source platform. It is written in TypeScript and can be run as a standalone binary or imported as a Node.js module through the balena SDK.

The balena CLI is distributed through npm and is available for Windows, macOS and Linux. It provides comprehensive tools for managing devices, applications, deployments, and more.

## Installation & Setup

Installation instructions and binaries are available on the official GitHub repository. Users upgrading from previous standalone installations to v22+ should consult the migration guide for important setup changes and breaking changes.

### Supported Shells

**Windows:**
- Command Prompt (cmd.exe)
- PowerShell
- Alternative shells: MSYS2, Git for Windows, Microsoft's Windows Subsystem for Linux (WSL)

**macOS and Linux:**
- Standard terminal windows
- Bash command auto-completion available via `balena autocomplete` command

## Authentication

Authentication is handled through the `balena login` command. The CLI supports several authentication methods:

1. **Web-based authorization** - Opens browser for OAuth flow
2. **Credentials** - Email/password login with optional two-factor authentication
3. **Authentication tokens** - Session tokens or API keys for automation

### Proxy Configuration

HTTP(S) proxy support is configured through environment variables and configuration files:

**Priority order:**
1. `BALENARC_PROXY` environment variable (highest priority)
2. Proxy settings in CLI config file
3. `HTTPS_PROXY` and `HTTP_PROXY` environment variables

**Exclusions:**
- Use `BALENARC_NO_PROXY` variable to exclude specific destinations
- Private IPv4 addresses and `*.local` hostnames are excluded by default

---

## CLI Commands Reference

### API Key Commands

#### `api-key generate <name>`

Generate a new API key for the current user.

**Options:**
- `--expiry-date <date>` - Optional expiration date for the API key

#### `api-key list`

List all API keys for the current user or a specific fleet.

#### `api-key revoke <id>`

Revoke (invalidate) a specified API key.

---

### Application & Block Commands

#### `app create <name>`

Create a new balena application (fleet).

**Options:**
- `--type <type>` - Application/device type
- `--organization <org>` - Organization to create the app under

#### `block create <name>`

Create a new balena block (reusable container service).

**Options:**
- `--type <type>` - Block device type
- `--organization <org>` - Organization to create the block under

---

### Configuration Commands

Configuration commands manage balenaOS image and device settings.

#### `config generate`

Generate a config.json file for a device or fleet. This configuration file contains device-specific settings required for provisioning.

**Options:**
- `--fleet <fleet>` - Fleet name or slug
- `--device <device>` - Device UUID
- `--version <version>` - balenaOS version
- `--network <network>` - Network configuration (ethernet/wifi)
- `--output <path>` - Output file path

#### `config inject <file>`

Inject a config.json file into a balenaOS image on removable media.

**Arguments:**
- `<file>` - Path to config.json file

**Options:**
- `--drive <drive>` - Target drive/device

#### `config read`

Read and display the config.json from a balenaOS image or device.

**Options:**
- `--drive <drive>` - Drive containing balenaOS image
- `--type <type>` - Device type

#### `config reconfigure`

Interactively reconfigure a balenaOS image or device.

**Options:**
- `--drive <drive>` - Drive to reconfigure
- `--advanced` - Show advanced configuration options

#### `config write <key> <value>`

Write a specific configuration parameter to a balenaOS image.

**Arguments:**
- `<key>` - Configuration key to modify
- `<value>` - New value for the configuration key

**Options:**
- `--drive <drive>` - Target drive

---

### Build & Deploy Commands

#### `build [source]`

Build container images using a local or remote Docker daemon.

**Arguments:**
- `[source]` - Source directory (defaults to current directory)

**Options:**
- `--arch <arch>` - Target architecture (e.g., amd64, armv7hf, aarch64)
- `--deviceType <type>` - Device type for the build
- `--docker <host>` - Docker daemon host
- `--dockerfle <file>` - Alternative Dockerfile path
- `--emulated` - Use QEMU for ARM builds on x86
- `--buildArg <arg=value>` - Docker build arguments (can be used multiple times)
- `--cache-from <image>` - Images to use for build cache
- `--nocache` - Don't use cache when building
- `--squash` - Squash image layers
- `--multi-dockerignore` - Use per-service .dockerignore files

#### `deploy <fleet> [image]`

Deploy a pre-built container image or project to a fleet.

**Arguments:**
- `<fleet>` - Fleet name or slug
- `[image]` - Pre-built image name (optional, builds from source if omitted)

**Options:**
- `--source <path>` - Source directory for build
- `--build` - Force build even if image is specified
- `--nologupload` - Don't upload build logs
- `--draft` - Deploy as draft release
- `--note <text>` - Add release note
- `--release-tag <tag>` - Tag the release

---

### Device Commands

#### `device <uuid>`

Display detailed information about a specific device.

**Arguments:**
- `<uuid>` - Device UUID or name

#### `device list`

List all devices accessible to the current user.

**Options:**
- `--fleet <fleet>` - Filter by fleet name or slug
- `--json` - Output in JSON format

#### `device detect`

Scan the local network for balenaOS devices in configurable mode.

#### `device ssh <uuid>`

Open an SSH shell session to a device.

**Arguments:**
- `<uuid>` - Device UUID, name, or local IP address

**Options:**
- `--port <port>` - SSH port (default: 22222 for balenaOS)
- `--verbose` - Verbose connection output
- `--host` - Connect to host OS instead of container
- `--service <service>` - Service name for multi-container apps

#### `device logs <uuid>`

Display and stream logs from a device.

**Arguments:**
- `<uuid>` - Device UUID or name

**Options:**
- `--tail [lines]` - Number of recent log lines to display
- `--follow` - Continuously stream new logs
- `--service <service>` - Filter logs by service name
- `--system` - Show system logs

#### `device reboot <uuid>`

Remotely reboot a device.

**Arguments:**
- `<uuid>` - Device UUID or name

**Options:**
- `--force` - Force reboot without graceful shutdown

#### `device shutdown <uuid>`

Remotely shut down a device.

**Arguments:**
- `<uuid>` - Device UUID or name

**Options:**
- `--force` - Force shutdown without graceful poweroff

#### `device restart <uuid>`

Restart a specific service container on a device.

**Arguments:**
- `<uuid>` - Device UUID or name

**Options:**
- `--service <service>` - Service name to restart (required for multi-container)

#### `device rename <uuid> [newName]`

Rename a device.

**Arguments:**
- `<uuid>` - Device UUID or current name
- `[newName]` - New device name (prompted if not provided)

#### `device note <uuid> [note]`

Set or update the note/description for a device.

**Arguments:**
- `<uuid>` - Device UUID or name
- `[note]` - Note text (prompted if not provided)

#### `device move <uuid> <fleet>`

Move a device to a different fleet.

**Arguments:**
- `<uuid>` - Device UUID or name
- `<fleet>` - Target fleet name or slug

#### `device register <fleet>`

Register a new device to a fleet and generate provisioning credentials.

**Arguments:**
- `<fleet>` - Fleet name or slug

**Options:**
- `--uuid <uuid>` - Custom device UUID

#### `device pin <uuid> <releaseId>`

Pin a device to a specific release version.

**Arguments:**
- `<uuid>` - Device UUID or name
- `<releaseId>` - Release ID or commit hash

#### `device track-fleet <uuid>`

Configure a device to track the current fleet release (unpin).

**Arguments:**
- `<uuid>` - Device UUID or name

#### `device local-mode <uuid>`

Enable or disable local mode on a device for development.

**Arguments:**
- `<uuid>` - Device UUID or name

**Options:**
- `--enable` - Enable local mode
- `--disable` - Disable local mode
- `--status` - Check current local mode status

#### `device public-url <uuid>`

Manage public URL access for a device.

**Arguments:**
- `<uuid>` - Device UUID or name

**Options:**
- `--enable` - Enable public URL
- `--disable` - Disable public URL
- `--status` - Check current public URL status

#### `device tunnel <uuid>`

Create a tunnel to access device ports locally.

**Arguments:**
- `<uuid>` - Device UUID or name

**Options:**
- `--port <port>` - Port number to tunnel (can be used multiple times)

#### `device os-update <uuid>`

Update the Host OS version on a device.

**Arguments:**
- `<uuid>` - Device UUID or name

**Options:**
- `--version <version>` - Target OS version

#### `device identify <uuid>`

Blink LED on device for identification (Raspberry Pi only).

**Arguments:**
- `<uuid>` - Device UUID or name

#### `device purge <uuid>`

Remove all user application data from a device.

**Arguments:**
- `<uuid>` - Device UUID or name

#### `device deactivate <uuid>`

Deactivate a device.

**Arguments:**
- `<uuid>` - Device UUID or name

#### `device rm <uuid>`

Permanently remove a device.

**Arguments:**
- `<uuid>` - Device UUID or name

**Options:**
- `--yes` - Skip confirmation prompt

#### `device start-service <uuid> <service>`

Start a specific service container on a device.

**Arguments:**
- `<uuid>` - Device UUID or name
- `<service>` - Service name

#### `device stop-service <uuid> <service>`

Stop a specific service container on a device.

**Arguments:**
- `<uuid>` - Device UUID or name
- `<service>` - Service name

---

### Environment Variable Commands

#### `env list`

List environment variables for fleets, devices, or services.

**Options:**
- `--fleet <fleet>` - Fleet name or slug
- `--device <device>` - Device UUID or name
- `--service <service>` - Service name
- `--config` - Show configuration variables
- `--json` - Output in JSON format

#### `env set <name> [value]`

Set an environment variable.

**Arguments:**
- `<name>` - Variable name
- `[value]` - Variable value (prompted if not provided)

**Options:**
- `--fleet <fleet>` - Fleet name or slug
- `--device <device>` - Device UUID or name
- `--service <service>` - Service name

#### `env rename <id> <value>`

Change the value of an environment variable.

**Arguments:**
- `<id>` - Variable ID
- `<value>` - New value

#### `env rm <id>`

Remove an environment variable.

**Arguments:**
- `<id>` - Variable ID

**Options:**
- `--yes` - Skip confirmation prompt

---

### Fleet Commands

#### `fleet create <name>`

Create a new fleet.

**Arguments:**
- `<name>` - Fleet name

**Options:**
- `--type <type>` - Device type
- `--organization <org>` - Organization name or slug

#### `fleet list`

List all fleets accessible to the current user.

**Options:**
- `--verbose` - Show additional fleet details
- `--json` - Output in JSON format

#### `fleet <fleet>`

Display detailed information about a specific fleet.

**Arguments:**
- `<fleet>` - Fleet name or slug

#### `fleet rename <fleet> <newName>`

Rename a fleet.

**Arguments:**
- `<fleet>` - Current fleet name or slug
- `<newName>` - New fleet name

#### `fleet pin <fleet> <release>`

Pin a fleet to a specific release.

**Arguments:**
- `<fleet>` - Fleet name or slug
- `<release>` - Release ID or commit hash

#### `fleet track-latest <fleet>`

Configure a fleet to track the latest release.

**Arguments:**
- `<fleet>` - Fleet name or slug

#### `fleet restart <fleet>`

Restart all devices in a fleet.

**Arguments:**
- `<fleet>` - Fleet name or slug

#### `fleet purge <fleet>`

Purge application data from all devices in a fleet.

**Arguments:**
- `<fleet>` - Fleet name or slug

#### `fleet rm <fleet>`

Permanently remove a fleet.

**Arguments:**
- `<fleet>` - Fleet name or slug

**Options:**
- `--yes` - Skip confirmation prompt

---

### Operating System Commands

#### `os download <type>`

Download a balenaOS image for a specific device type.

**Arguments:**
- `<type>` - Device type

**Options:**
- `--version <version>` - OS version to download
- `--output <path>` - Output file path

#### `os initialize <image>`

Initialize a balenaOS image on removable media.

**Arguments:**
- `<image>` - Path to OS image file

**Options:**
- `--drive <drive>` - Target drive
- `--yes` - Skip confirmation prompt

#### `os configure <image>`

Configure a balenaOS image with device/fleet settings.

**Arguments:**
- `<image>` - Path to OS image file

**Options:**
- `--fleet <fleet>` - Fleet name or slug
- `--config <file>` - Path to config.json file
- `--config-network <type>` - Network type (ethernet/wifi)
- `--config-wifi-key <key>` - WiFi password
- `--config-wifi-ssid <ssid>` - WiFi SSID

#### `os versions <type>`

List available balenaOS versions for a device type.

**Arguments:**
- `<type>` - Device type

---

### Local Development Commands

#### `local configure <target>`

Configure a local balenaOS device for development.

**Arguments:**
- `<target>` - Device IP address

#### `local flash <image>`

Flash a balenaOS image to removable media.

**Arguments:**
- `<image>` - Path to image file

**Options:**
- `--drive <drive>` - Target drive
- `--yes` - Skip confirmation prompt

---

### Additional Commands

#### `device-type list`

List all supported device types.

**Options:**
- `--json` - Output in JSON format

#### `push <fleet>`

Push code to a fleet or local device for live testing.

**Arguments:**
- `<fleet>` - Fleet name/slug or device IP for local mode

**Options:**
- `--source <path>` - Source directory
- `--emulated` - Use QEMU for emulation
- `--nolive` - Deploy without live updates
- `--detached` - Run build in background
- `--service <service>` - Target specific service
- `--env <VAR=value>` - Set environment variables

#### `preload <image>`

Preload a release into a balenaOS image for offline provisioning.

**Arguments:**
- `<image>` - Path to OS image file

**Options:**
- `--fleet <fleet>` - Fleet name or slug
- `--commit <hash>` - Specific release commit
- `--splash-image <file>` - Custom splash screen image

#### `join [deviceIp]`

Move a local device to an account (associate with balenaCloud).

**Arguments:**
- `[deviceIp]` - Device IP address (auto-detected if omitted)

#### `leave [deviceIp]`

Remove a local device from an account.

**Arguments:**
- `[deviceIp]` - Device IP address (auto-detected if omitted)

#### `organization list`

List all organizations the current user belongs to.

**Options:**
- `--json` - Output in JSON format

#### `ssh-key <id>`

Display a specific SSH public key.

**Arguments:**
- `<id>` - SSH key ID

#### `ssh-key add <name> [path]`

Add a new SSH public key.

**Arguments:**
- `<name>` - Key name/label
- `[path]` - Path to public key file (defaults to ~/.ssh/id_rsa.pub)

#### `ssh-key list`

List all SSH keys associated with the account.

#### `ssh-key rm <id>`

Remove an SSH key.

**Arguments:**
- `<id>` - SSH key ID

**Options:**
- `--yes` - Skip confirmation prompt

#### `tag list`

List tags for releases, devices, or fleets.

**Options:**
- `--fleet <fleet>` - Fleet name or slug
- `--device <device>` - Device UUID
- `--release <release>` - Release ID

#### `tag set <name> [value]`

Set a tag value.

**Arguments:**
- `<name>` - Tag name
- `[value]` - Tag value

**Options:**
- `--fleet <fleet>` - Fleet name or slug
- `--device <device>` - Device UUID
- `--release <release>` - Release ID

#### `tag rm <name>`

Remove a tag.

**Arguments:**
- `<name>` - Tag name

**Options:**
- `--fleet <fleet>` - Fleet name or slug
- `--device <device>` - Device UUID
- `--release <release>` - Release ID
- `--yes` - Skip confirmation prompt

#### `release <commitOrId>`

Display information about a release.

**Arguments:**
- `<commitOrId>` - Release commit hash or ID

#### `release list`

List all releases for a fleet.

**Options:**
- `--fleet <fleet>` - Fleet name or slug

#### `release finalize <commitOrId>`

Finalize a draft release.

**Arguments:**
- `<commitOrId>` - Release commit hash or ID

#### `release invalidate <commitOrId>`

Invalidate a release.

**Arguments:**
- `<commitOrId>` - Release commit hash or ID

#### `release-asset list <commitOrId>`

List release assets.

**Arguments:**
- `<commitOrId>` - Release commit hash or ID

#### `release-asset add <commitOrId> <assetPath>`

Add a release asset.

**Arguments:**
- `<commitOrId>` - Release commit hash or ID
- `<assetPath>` - Path to asset file

#### `release-asset rm <commitOrId> <assetId>`

Remove a release asset.

**Arguments:**
- `<commitOrId>` - Release commit hash or ID
- `<assetId>` - Asset ID

#### `settings`

Display CLI configuration settings.

#### `support`

Access balena support resources and information.

#### `util available-drives`

List available drives/storage devices for flashing.

**Options:**
- `--json` - Output in JSON format

---

## Advanced Features

### Multi-Container Support

The CLI fully supports multi-container applications through docker-compose.yml files. The `build`, `deploy`, and `push` commands understand docker-compose syntax and can build and deploy microservices architectures.

**Example docker-compose.yml structure:**
```yaml
version: '2'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
  backend:
    build: ./backend
    environment:
      - DATABASE_URL
```

### Registry Secrets

Private Docker registry authentication can be configured using secrets files in YAML or JSON format. This enables pulling from private registries during builds.

**Supported registries:**
- Docker Hub
- Google Container Registry (gcr.io)
- Amazon ECR
- Azure Container Registry
- Private registries

### .dockerignore Support

Projects can use `.dockerignore` files to exclude files from build contexts:

- Standard `.dockerignore` applies to all services
- `--multi-dockerignore` option enables per-service `.dockerignore` files
- Default patterns always exclude `.git` directories
- `.balena`, `.resin`, and Dockerfile entries are preserved

### Fleet Identification

**Fleet Names vs Slugs:**
- Fleet names are not unique and may cause ambiguity
- Slugs are unique identifiers (format: `organization/fleet-name`)
- Slugs are recommended for scripts and automation
- Use `balena fleet list` to see both names and slugs

---

## Versioning & Support

The balena CLI follows semantic versioning (SemVer):

- **Major versions**: Introduce breaking changes
- **Minor versions**: Add backward-compatible features
- **Patch versions**: Include backward-compatible bug fixes

**Compatibility Policy:**
- Major CLI versions remain compatible with balenaCloud for at least one year after the next major release
- Deprecation warnings appear six months before features are removed
- Removed features require the `--unsupported` flag until the compatibility period ends

**Support Resources:**
- Masterclass tutorials and guides
- GitHub issue tracker
- Balena forums community
- Official documentation

---

## Best Practices

1. **Use slugs instead of names** for fleet identification in scripts
2. **Enable bash completion** with `balena autocomplete` for faster command entry
3. **Leverage local mode** for faster development iterations
4. **Use API keys** for automation instead of user credentials
5. **Tag releases** with meaningful version numbers for better tracking
6. **Set up proxy configuration** in corporate environments
7. **Use multi-dockerignore** for cleaner multi-container builds
8. **Monitor device logs** during development with `device logs --follow`
9. **Pin critical devices** to stable releases in production
10. **Regularly update the CLI** to access new features and bug fixes

---

## Common Workflows

### Initial Device Setup
```bash
# Download OS image
balena os download <device-type> --version <version>

# Configure the image
balena os configure <image-file> --fleet <fleet-name>

# Flash to SD card
balena local flash <image-file> --drive <drive>
```

### Development Workflow
```bash
# Build and test locally
balena build --arch <architecture>

# Push to device in local mode
balena push <device-ip>

# Deploy to fleet
balena deploy <fleet-name>
```

### Device Management
```bash
# List all devices
balena device list

# SSH into device
balena device ssh <uuid>

# View logs
balena device logs <uuid> --follow

# Update OS
balena device os-update <uuid> --version <version>
```

### Fleet Operations
```bash
# Create new fleet
balena fleet create <name> --type <device-type>

# Deploy release
balena deploy <fleet-name>

# Pin fleet to release
balena fleet pin <fleet-name> <release-id>

# Restart all devices
balena fleet restart <fleet-name>
```

---

*This documentation is based on balena CLI version 23.2.30. For the most up-to-date information, visit the official balena documentation at https://docs.balena.io/*