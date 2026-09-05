# Sensor Index

Sensors published to the Enterprise Script Repository. This table is generated and
rewritten by **ESR Manager**; everything between the `ESR-INDEX` markers is machine-owned,
so edit items through the app rather than by hand. Anything outside the markers is yours.

<!-- ESR-INDEX:BEGIN -->
| Icon | Name | Description | Version | OS | Path |
|------|------|-------------|---------|----|------|
| 🔒 | BitLocker Protection Status | Returns true when the OS volume is fully encrypted and protection is on. | 1.0.0 | Windows | sensors/windows/bitlocker-protection-status.json |
| ⏱️ | Days Since Last Reboot | Whole days since the last boot. Surfaces the long-uptime devices that never finish patch installs. | 1.0.0 | Windows | sensors/windows/days-since-last-reboot-windows.json |
| 💾 | Free Disk Space (GB) | Whole gigabytes free on the system drive. Drives the low-disk smart group used to target cleanup scripts before feature updates. | 1.0.0 | Windows | sensors/windows/free-disk-space-gb-windows.json |
| ♻️ | Pending Reboot Required | Returns true when servicing, Windows Update or a pending file rename is waiting on a restart. Targets reboot prompts at only the devices that need one. | 1.0.0 | Windows | sensors/windows/pending-reboot-required-windows.json |
| 🔐 | TPM Ready State | Returns true when a TPM is present, enabled and ready for use. Identifies devices that cannot take BitLocker, Credential Guard or Windows 11. | 1.0.0 | Windows | sensors/windows/tpm-ready-state.json |
| 🪟 | Windows Build Version | Edition, feature release and full build number including the UBR, for example 'Windows 11 Pro 24H2 (26100.1742)'. Gives patch reporting a single accurate version string. | 1.0.0 | Windows | sensors/windows/windows-build-version.json |
| 🔋 | Battery Cycle Count | Charge cycles on the internal battery, or 0 on desktops. Supports battery replacement and hardware refresh planning. | 1.0.0 | macOS | sensors/macos/battery-cycle-count.json |
| ⏱️ | Days Since Last Reboot | Whole days since the last boot. Finds the Macs that never restart and so never finish pending updates. | 1.0.0 | macOS | sensors/macos/days-since-last-reboot-macos.json |
| 🔐 | FileVault Status | Returns true when FileVault full-disk encryption is enabled. | 1.0.0 | macOS | sensors/macos/filevault-status.json |
| 💾 | Free Disk Space (GB) | Whole gigabytes available on the boot volume. Identifies Macs that will fail a macOS upgrade for lack of space. | 1.0.0 | macOS | sensors/macos/free-disk-space-gb-macos.json |
| 🍎 | macOS Version | Product version and build, for example '15.6 (24G84)'. Drives OS-version smart groups and upgrade reporting. | 1.0.0 | macOS | sensors/macos/macos-version.json |
| 🛡️ | System Integrity Protection Enabled | Returns true when SIP is enabled. Flags Macs left with SIP disabled after imaging or troubleshooting. | 1.0.0 | macOS | sensors/macos/sip-status.json |
| ⏱️ | Days Since Last Reboot | Whole days of uptime from /proc/uptime. Finds hosts still running a kernel that a patch cycle has already replaced. | 1.0.0 | Linux | sensors/linux/days-since-last-reboot-linux.json |
| 🐧 | Distribution Name | The PRETTY_NAME from /etc/os-release, for example 'Ubuntu 24.04.2 LTS'. Groups a mixed Linux estate by distribution and release. | 1.0.0 | Linux | sensors/linux/distribution-name.json |
| 💾 | Free Disk Space (GB) | Whole gigabytes available on the root filesystem. Drives the low-disk smart group used before package upgrades. | 1.0.0 | Linux | sensors/linux/free-disk-space-gb-linux.json |
| 📦 | Pending Package Updates | Counts packages with available updates across apt, dnf/yum and zypper hosts. | 1.0.0 | Linux | sensors/linux/pending-package-updates.json |
| ♻️ | Reboot Required | Returns true when the package manager or a kernel update is waiting on a restart, across apt, dnf/yum and zypper hosts. | 1.0.0 | Linux | sensors/linux/reboot-required-linux.json |
| 🔒 | Root Volume Encrypted | Returns true when the root filesystem sits on a LUKS or dm-crypt device. Provides the encryption-at-rest datapoint for Linux compliance reporting. | 1.0.0 | Linux | sensors/linux/root-volume-encrypted.json |
<!-- ESR-INDEX:END -->
