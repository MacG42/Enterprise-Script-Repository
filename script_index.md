# Script Index

Scripts published to the Enterprise Script Repository. This table is generated and
rewritten by **ESR Manager**; everything between the `ESR-INDEX` markers is machine-owned,
so edit items through the app rather than by hand. Anything outside the markers is yours.

<!-- ESR-INDEX:BEGIN -->
| Icon | Name | Description | Version | OS | Path |
|------|------|-------------|---------|----|------|
| 🖨️ | Clear Print Spooler Queue | Stops the spooler, deletes every queued job in the PRINTERS folder and starts the service again. Clears jobs stuck in a deleting or error state. | 1.0.0 | Windows | scripts/windows/clear-print-spooler-queue.json |
| 🔁 | Force Policy and MDM Sync | Runs a forced gpupdate, kicks the EnterpriseMgmt MDM sync scheduled tasks and restarts the Workspace ONE Hub service so the device checks in immediately. | 1.0.0 | Windows | scripts/windows/force-policy-and-mdm-sync.json |
| 🧹 | Reclaim Disk Space | Purges system and per-user temp folders, the Windows Update download cache, CBS logs, the Delivery Optimization cache and the recycle bin, then reports how much space was recovered. | 1.0.0 | Windows | scripts/windows/reclaim-disk-space-windows.json |
| 🧽 | Remove Preinstalled Consumer Apps | Removes the comma-separated AppX packages listed in ESR_APPS for all users and from the provisioning store so they do not return for new profiles. | 1.0.0 | Windows | scripts/windows/remove-preinstalled-consumer-apps.json |
| 🔄 | Reset Windows Update Components | Stops the update services, clears the SoftwareDistribution and catroot2 caches, restarts the services and forces a new detection pass. Fixes stuck or failing Windows Update scans. | 1.0.0 | Windows | scripts/windows/reset-windows-update-components.json |
| 🖥️ | Set Device Hostname | Renames the device to a serial-number-based hostname using the ESR_PREFIX variable, then flags a restart as required. | 1.0.0 | Windows | scripts/windows/set-device-hostname.json |
| 🛡️ | Enable Application Firewall | Turns on the macOS application firewall with stealth mode and logging, and allows signed system and downloaded software. Remediates a failed firewall compliance check. | 1.0.0 | macOS | scripts/macos/enable-application-firewall.json |
| 🌐 | Flush DNS Cache | Clears the macOS DNS resolver cache and restarts mDNSResponder. Useful after a DNS or VPN configuration change. | 1.0.0 | macOS | scripts/macos/flush-dns-cache.json |
| 🔁 | Force MDM Check-in | Renews the MDM enrollment profile and triggers a Workspace ONE Intelligent Hub sync so policies, profiles and apps are re-evaluated immediately. | 1.0.0 | macOS | scripts/macos/force-hub-checkin-macos.json |
| 🧩 | Install Rosetta 2 | Installs Rosetta 2 non-interactively on Apple silicon so Intel-only line-of-business apps run. Exits cleanly on Intel Macs and when Rosetta is already present. | 1.0.0 | macOS | scripts/macos/install-rosetta.json |
| 🧹 | Reclaim Disk Space | Removes stale system and per-user caches, empties user trash folders, prunes rotated logs and deletes local Time Machine snapshots, then reports the space recovered. | 1.0.0 | macOS | scripts/macos/reclaim-disk-space-macos.json |
| 🖥️ | Set Computer Name From Serial | Sets ComputerName, LocalHostName and HostName to ESR_PREFIX plus the hardware serial number so the Mac matches the naming standard in inventory and DNS. | 1.0.0 | macOS | scripts/macos/set-computer-name-from-serial.json |
<!-- ESR-INDEX:END -->
