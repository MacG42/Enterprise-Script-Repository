# Sensor Index

Sensors published to the Enterprise Script Repository. The table between the `ESR-INDEX`
markers is machine-owned. ESR Manager rewrites it when it publishes, and the *Rebuild indexes*
workflow rewrites it whenever a file lands in `scripts/` or `sensors/` by any other route — so
uploading a JSON item through the GitHub web UI is enough, with no clone and no hand edits.
Each item carries a GUID `id`; only the newest version of an id is listed here. Anything
outside the markers is yours.

<!-- ESR-INDEX:BEGIN -->
| Icon | Name | Description | Version | OS | Tags | Id | Path |
|------|------|-------------|---------|----|------|----|------|
| 🔒 | BitLocker Protection Status | Returns true when the OS volume is fully encrypted and protection is on. | 1.0.0 | Windows | security, encryption, bitlocker, compliance | c0d70b89-15fc-408f-a62a-d28ac031dd0f | sensors/windows/bitlocker-protection-status.json |
| ⏱️ | Days Since Last Reboot | Whole days since the last boot. Surfaces the long-uptime devices that never finish patch installs. | 1.0.0 | Windows | uptime, patching, health | e1718255-b5ec-4739-bcd2-6551f7737c94 | sensors/windows/days-since-last-reboot-windows.json |
| 💾 | Free Disk Space (GB) | Whole gigabytes free on the system drive. Drives the low-disk smart group used to target cleanup scripts before feature updates. | 1.0.0 | Windows | disk, capacity, inventory | c171f0af-ca29-4127-97f0-27ccdc8e5b86 | sensors/windows/free-disk-space-gb-windows.json |
| ♻️ | Pending Reboot Required | Returns true when servicing, Windows Update or a pending file rename is waiting on a restart. Targets reboot prompts at only the devices that need one. | 1.0.0 | Windows | patching, reboot, compliance | 3be2495f-339a-4f7b-beb9-9e013ddeddfd | sensors/windows/pending-reboot-required-windows.json |
| 🔐 | TPM Ready State | Returns true when a TPM is present, enabled and ready for use. Identifies devices that cannot take BitLocker, Credential Guard or Windows 11. | 1.0.0 | Windows | security, tpm, hardware, readiness | 248c0aa9-da1b-490f-890b-44cce8beffd7 | sensors/windows/tpm-ready-state.json |
| 🪟 | Windows Build Version | Edition, feature release and full build number including the UBR, for example 'Windows 11 Pro 24H2 (26100.1742)'. Gives patch reporting a single accurate version string. | 1.0.0 | Windows | inventory, patching, os-version | 859de0e0-e1d8-4646-98af-2779de1affb0 | sensors/windows/windows-build-version.json |
| 🔋 | Battery Cycle Count | Charge cycles on the internal battery, or 0 on desktops. Supports battery replacement and hardware refresh planning. | 1.0.0 | macOS | hardware, battery, lifecycle | 3bdc0952-2a36-4f14-befc-83a665b3316a | sensors/macos/battery-cycle-count.json |
| ⏱️ | Days Since Last Reboot | Whole days since the last boot. Finds the Macs that never restart and so never finish pending updates. | 1.0.0 | macOS | uptime, patching, health | 0657dd59-4eac-46e3-b81f-96cf15fceafd | sensors/macos/days-since-last-reboot-macos.json |
| 🔐 | FileVault Status | Returns true when FileVault full-disk encryption is enabled. | 1.0.0 | macOS | security, encryption, filevault, compliance | 57e0c760-e470-4dce-a74a-659126b07b88 | sensors/macos/filevault-status.json |
| 💾 | Free Disk Space (GB) | Whole gigabytes available on the boot volume. Identifies Macs that will fail a macOS upgrade for lack of space. | 1.0.0 | macOS | disk, capacity, inventory | 4b62c02c-6fd5-41d2-b6cc-ef8674a9ed40 | sensors/macos/free-disk-space-gb-macos.json |
| 🍎 | macOS Version | Product version and build, for example '15.6 (24G84)'. Drives OS-version smart groups and upgrade reporting. | 1.0.0 | macOS | inventory, os-version, patching | d89a7d40-e40e-43ac-91f7-b2df3a4be081 | sensors/macos/macos-version.json |
| 🛡️ | System Integrity Protection Enabled | Returns true when SIP is enabled. Flags Macs left with SIP disabled after imaging or troubleshooting. | 1.0.0 | macOS | security, sip, compliance | e4d4b21c-f2aa-4164-bf6e-7a06390f6dfc | sensors/macos/sip-status.json |
| ⏱️ | Days Since Last Reboot | Whole days of uptime from /proc/uptime. Finds hosts still running a kernel that a patch cycle has already replaced. | 1.0.0 | Linux | uptime, patching, health | 4a04dd98-4b7a-4f16-90e7-2d8c45ae7090 | sensors/linux/days-since-last-reboot-linux.json |
| 🐧 | Distribution Name | The PRETTY_NAME from /etc/os-release, for example 'Ubuntu 24.04.2 LTS'. Groups a mixed Linux estate by distribution and release. | 1.0.0 | Linux | inventory, os-version | b16e6346-0a91-4072-959a-ff524e17ed3a | sensors/linux/distribution-name.json |
| 💾 | Free Disk Space (GB) | Whole gigabytes available on the root filesystem. Drives the low-disk smart group used before package upgrades. | 1.0.0 | Linux | disk, capacity, inventory | a5fef28f-cae5-4e3f-b9e3-3a141c2c49c7 | sensors/linux/free-disk-space-gb-linux.json |
| 📦 | Pending Package Updates | Counts packages with available updates across apt, dnf/yum and zypper hosts. | 1.0.0 | Linux | patching, updates, inventory | 23c62835-bbac-4b7c-a954-f91f47a1db4d | sensors/linux/pending-package-updates.json |
| ♻️ | Reboot Required | Returns true when the package manager or a kernel update is waiting on a restart, across apt, dnf/yum and zypper hosts. | 1.0.0 | Linux | patching, reboot, compliance | 00402944-a31d-4991-bdbf-061b7f24d83c | sensors/linux/reboot-required-linux.json |
| 🔒 | Root Volume Encrypted | Returns true when the root filesystem sits on a LUKS or dm-crypt device. Provides the encryption-at-rest datapoint for Linux compliance reporting. | 1.0.0 | Linux | security, encryption, compliance, luks | f11412d7-6d37-4ba9-ae17-b62774eb7814 | sensors/linux/root-volume-encrypted.json |
<!-- ESR-INDEX:END -->
