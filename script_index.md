# Script Index

Scripts published to the Enterprise Script Repository. The table between the `ESR-INDEX`
markers is machine-owned. ESR Manager rewrites it when it publishes, and the *Rebuild indexes*
workflow rewrites it whenever a file lands in `scripts/` or `sensors/` by any other route — so
uploading a JSON item through the GitHub web UI is enough, with no clone and no hand edits.
Each item carries a GUID `id`; only the newest version of an id is listed here. Anything
outside the markers is yours.

<!-- ESR-INDEX:BEGIN -->
| Icon | Name | Description | Version | OS | Tags | Id | Path |
|------|------|-------------|---------|----|------|----|------|
| 🖨️ | Clear Print Spooler Queue | Stops the spooler, deletes every queued job in the PRINTERS folder and starts the service again. Clears jobs stuck in a deleting or error state. | 1.0.0 | Windows | printing, spooler, helpdesk | 85eda259-9839-4659-8ac9-297f07e9b74b | scripts/windows/clear-print-spooler-queue.json |
| 🔁 | Force Policy and MDM Sync | Runs a forced gpupdate, kicks the EnterpriseMgmt MDM sync scheduled tasks and restarts the Workspace ONE Hub service so the device checks in immediately. | 1.0.0 | Windows | mdm, sync, troubleshooting | 467a0312-5536-4094-b527-ac609c45caf5 | scripts/windows/force-policy-and-mdm-sync.json |
| 🧹 | Reclaim Disk Space | Purges system and per-user temp folders, the Windows Update download cache, CBS logs, the Delivery Optimization cache and the recycle bin, then reports how much space was recovered. | 1.0.0 | Windows | disk, cleanup, maintenance | 3550971f-7ece-435f-ae00-32629f4a2cc0 | scripts/windows/reclaim-disk-space-windows.json |
| 🧽 | Remove Preinstalled Consumer Apps | Removes the comma-separated AppX packages listed in ESR_APPS for all users and from the provisioning store so they do not return for new profiles. | 1.0.0 | Windows | provisioning, appx, debloat | 68d3f6db-0de8-49f3-80eb-2973f8f04bfd | scripts/windows/remove-preinstalled-consumer-apps.json |
| 🔄 | Reset Windows Update Components | Stops the update services, clears the SoftwareDistribution and catroot2 caches, restarts the services and forces a new detection pass. Fixes stuck or failing Windows Update scans. | 1.0.0 | Windows | patching, windows-update, remediation | d38447c5-53e2-4f58-9a15-f8a824ddd59b | scripts/windows/reset-windows-update-components.json |
| 🖥️ | Set Device Hostname | Renames the device to a serial-number-based hostname using the ESR_PREFIX variable, then flags a restart as required. | 1.0.0 | Windows | provisioning, hostname, naming | 6ec3a962-9755-4ca4-85d4-73ddc7a8bbb9 | scripts/windows/set-device-hostname.json |
| 🛡️ | Enable Application Firewall | Turns on the macOS application firewall with stealth mode and logging, and allows signed system and downloaded software. Remediates a failed firewall compliance check. | 1.0.0 | macOS | security, firewall, compliance | 3ed30f0d-6084-4753-b701-b74b3fba74f5 | scripts/macos/enable-application-firewall.json |
| 🌐 | Flush DNS Cache | Clears the macOS DNS resolver cache and restarts mDNSResponder. Useful after a DNS or VPN configuration change. | 1.0.0 | macOS | network, dns, troubleshooting | 093a28c2-eeeb-4ca2-aa5a-2ce0cbe08db9 | scripts/macos/flush-dns-cache.json |
| 🔁 | Force MDM Check-in | Renews the MDM enrollment profile and triggers a Workspace ONE Intelligent Hub sync so policies, profiles and apps are re-evaluated immediately. | 1.0.0 | macOS | mdm, sync, troubleshooting | 9844b1d7-77bb-45ef-8ce2-241a0f3f58fb | scripts/macos/force-hub-checkin-macos.json |
| 🧩 | Install Rosetta 2 | Installs Rosetta 2 non-interactively on Apple silicon so Intel-only line-of-business apps run. Exits cleanly on Intel Macs and when Rosetta is already present. | 1.0.0 | macOS | provisioning, apple-silicon, compatibility | be2a7b55-0cb6-4cdc-b5f9-be98b8823416 | scripts/macos/install-rosetta.json |
| 🧹 | Reclaim Disk Space | Removes stale system and per-user caches, empties user trash folders, prunes rotated logs and deletes local Time Machine snapshots, then reports the space recovered. | 1.0.0 | macOS | disk, cleanup, maintenance | a3206f44-ad75-4199-ae78-9fdd6315227f | scripts/macos/reclaim-disk-space-macos.json |
| 🖥️ | Set Computer Name From Serial | Sets ComputerName, LocalHostName and HostName to ESR_PREFIX plus the hardware serial number so the Mac matches the naming standard in inventory and DNS. | 1.0.0 | macOS | provisioning, hostname, naming | 077bf1cc-fec4-4d7c-8ed5-a349e7f423b6 | scripts/macos/set-computer-name-from-serial.json |
<!-- ESR-INDEX:END -->
