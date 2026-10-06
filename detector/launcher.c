#define UNICODE
#define _UNICODE
#include <windows.h>
#include <wchar.h>
#include "detector-script.h"

// A visible Windows UI runs an embedded, read-only inventory script.
// No execution-policy changes, elevated privileges, network calls or persistence.
int WINAPI wWinMain(HINSTANCE instance, HINSTANCE previous, PWSTR args, int show) {
    (void)instance; (void)previous; (void)args; (void)show;
    WCHAR systemPath[MAX_PATH], executable[MAX_PATH], command[32767];
    UINT length = GetSystemDirectoryW(systemPath, MAX_PATH);
    if (!length || length >= MAX_PATH) return 1;
    if (swprintf(executable, MAX_PATH, L"%ls\\WindowsPowerShell\\v1.0\\powershell.exe", systemPath) < 0) return 1;
    if (GetFileAttributesW(executable) == INVALID_FILE_ATTRIBUTES) {
        MessageBoxW(NULL, L"Windows PowerShell nao foi encontrado. Use um Windows 10 ou 11 com PowerShell disponivel, ou cadastre suas pecas manualmente no site.", L"UpgradePC Detector", MB_OK | MB_ICONERROR);
        return 1;
    }
    if (swprintf(command, 32767, L"\"%ls\" -NoLogo -NoProfile -STA -EncodedCommand %ls", executable, DETECTOR_SCRIPT) < 0) return 1;
    STARTUPINFOW startup = {0}; startup.cb = sizeof(startup);
    PROCESS_INFORMATION process = {0};
    if (!CreateProcessW(executable, command, NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, systemPath, &startup, &process)) {
        MessageBoxW(NULL, L"Nao foi possivel iniciar o Detector. Respeite as politicas deste computador e use o cadastro manual se a execucao estiver bloqueada.", L"UpgradePC Detector", MB_OK | MB_ICONERROR);
        return 1;
    }
    WaitForSingleObject(process.hProcess, INFINITE);
    DWORD code = 0; GetExitCodeProcess(process.hProcess, &code);
    CloseHandle(process.hThread); CloseHandle(process.hProcess);
    if (code) MessageBoxW(NULL, L"O Detector nao conseguiu abrir ou concluir sua interface. Verifique se o Windows PowerShell e os componentes do Windows estao disponiveis. Voce pode continuar usando o cadastro manual.", L"UpgradePC Detector", MB_OK | MB_ICONWARNING);
    return (int)code;
}
