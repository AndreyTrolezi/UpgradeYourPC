# UpgradePC Detector 1.0.0

Portable, unsigned Windows x64 helper for the existing Upgrade PC site. Windows 10/11 and Windows PowerShell 5.1/WinForms are required. It makes no network requests, installs no service, requests no elevation, and changes no execution policy.

Flow: open the executable → click Detectar → inspect the complete JSON → choose a file to save → import and review in Meu PC → apply to the editor → explicitly save the profile. The executable does not need account credentials or API keys.

CPU, motherboard, video adapters, individual physical RAM modules, physical disks and active monitors are read through local CIM. Only explicitly selected model/specification fields enter the report. No serial numbers, MAC/IP addresses, hostname, username, paths, documents, keys or credentials are collected. Power supply, cooler and case remain manual. GPU VRAM is intentionally not read through the 32-bit AdapterRAM field. Monitor resolution/refresh are not guessed from video-adapter output. Disk interface strings are kept as reported, not interpreted as NVMe/SATA.

Build from the repository root with `python3 detector/build.py /path/to/zig` (Zig 0.13.0). The build emits the executable, readable PowerShell source, manifest and SHA-256 to `public/downloads`. The launcher uses the system PowerShell path explicitly. Signing is not included; do not instruct people to disable security software or enterprise policy.

Validation: cross-compilation and structural PE checks are possible on Linux. Hardware detection and the native Windows UI still require a Windows machine; no Linux fixture proves real Windows hardware detection.

Provider references:

- [Win32_Processor](https://learn.microsoft.com/en-us/windows/win32/cimwin32prov/win32-processor)
- [Win32_BaseBoard](https://learn.microsoft.com/en-us/windows/win32/cimwin32prov/win32-baseboard)
- [Win32_VideoController](https://learn.microsoft.com/en-us/windows/win32/cimwin32prov/win32-videocontroller)
- [Win32_PhysicalMemory](https://learn.microsoft.com/en-us/windows/win32/cimwin32prov/win32-physicalmemory)
- [Win32_DiskDrive](https://learn.microsoft.com/en-us/windows/win32/cimwin32prov/win32-diskdrive)
- [WmiMonitorID](https://learn.microsoft.com/en-us/windows/win32/wmicoreprov/wmimonitorid)
- [CreateProcessW](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessw)
