"""Build with a local Zig compiler, e.g. python3 detector/build.py /path/to/zig."""
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parent.parent
source = root / "detector"
output = root / "public" / "downloads"
output.mkdir(parents=True, exist_ok=True)
script = (source / "Detector.ps1").read_text(encoding="utf-8")
# Standard PowerShell Unicode transport; the readable source is shipped alongside it.
encoded = base64.b64encode(script.encode("utf-16le")).decode("ascii")
if len(encoded) + 512 >= 32767:
    raise RuntimeError("Embedded command exceeds the Windows command-line limit")
with tempfile.TemporaryDirectory(prefix="upgradepc-build-") as tmp:
    Path(tmp, "detector-script.h").write_text('static const wchar_t DETECTOR_SCRIPT[] = L"' + encoded + '";\n')
    subprocess.run([sys.argv[1] if len(sys.argv) > 1 else "zig", "cc", "-target", "x86_64-windows-gnu", "-O2", "-s", "-municode", "-Wl,--subsystem,windows", "-fno-ident", "-I", tmp, str(source / "launcher.c"), "-luser32", "-o", str(output / "UpgradePC-Detector.exe")], check=True)
(output / "UpgradePC-Detector.pdb").unlink(missing_ok=True)
binary = (output / "UpgradePC-Detector.exe").read_bytes()
digest = hashlib.sha256(binary).hexdigest()
(output / "UpgradePC-Detector.sha256.txt").write_text(digest + "  UpgradePC-Detector.exe\n")
(output / "UpgradePC-Detector.ps1").write_text(script, encoding="utf-8-sig")
(output / "detector-manifest.json").write_text(json.dumps({"version": "1.0.0", "schemaVersion": 1, "platform": "Windows x64", "sha256": digest, "bytes": len(binary), "signed": False}, indent=2) + "\n")
print(f"Windows x64 detector built: {len(binary)} bytes. SHA-256: {digest}")
