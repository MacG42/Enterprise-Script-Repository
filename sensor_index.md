# Sensor Index

Sensors published to the Enterprise Script Repository. This table is generated and
rewritten by **ESR Manager**; everything between the `ESR-INDEX` markers is machine-owned,
so edit items through the app rather than by hand. Anything outside the markers is yours.

<!-- ESR-INDEX:BEGIN -->
| Icon | Name | Description | Version | OS | Path |
|------|------|-------------|---------|----|------|
| 🔒 | BitLocker Protection Status | Returns true when the OS volume is fully encrypted and protection is on. | 1.0.0 | Windows | sensors/windows/bitlocker-protection-status.json |
| 🔐 | FileVault Status | Returns true when FileVault full-disk encryption is enabled. | 1.0.0 | macOS | sensors/macos/filevault-status.json |
| 📦 | Pending Package Updates | Counts packages with available updates across apt, dnf/yum and zypper hosts. | 1.0.0 | Linux | sensors/linux/pending-package-updates.json |
<!-- ESR-INDEX:END -->
