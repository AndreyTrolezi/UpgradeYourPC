# UpgradePC Detector 1.0.0. Local read-only inventory, no network or administrator rights.
# Each query explicitly selects only the fields needed for the configuration.
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
$script:report = $null
$script:items = New-Object System.Collections.ArrayList
$script:notes = New-Object System.Collections.ArrayList
function Read-Cim($class, $properties, $namespace = 'root/cimv2') {
    try { return @(Get-CimInstance -ClassName $class -Namespace $namespace -Property $properties -OperationTimeoutSec 8 -ErrorAction Stop) }
    catch { [void]$script:notes.Add("Nao foi possivel consultar $class. Complete essa categoria manualmente."); return @() }
}
function Text($value) { if ($null -eq $value) { return '' }; return ([string]$value).Trim() }
function Edid-Text($values) { return -join @($values | Where-Object { $_ -gt 0 -and $_ -lt 127 } | ForEach-Object { [char]$_ }) }
function Add-Part($category, $name, $brand, $number, $specs) {
    if ([string]::IsNullOrWhiteSpace($name)) { $name = "Modelo nao informado ($category)" }
    [void]$script:items.Add([ordered]@{ category = $category; name = $name; manufacturer = $brand; partNumber = $number; specs = $specs })
}
function Status($message) { $status.Text = $message; [System.Windows.Forms.Application]::DoEvents() }
$form = New-Object System.Windows.Forms.Form
$form.Text = 'UpgradePC Detector - 1.0.0'
$form.Size = New-Object System.Drawing.Size(820,640)
$form.MinimumSize = New-Object System.Drawing.Size(640,480)
$form.StartPosition = 'CenterScreen'
$form.Font = New-Object System.Drawing.Font('Segoe UI',10)
$form.BackColor = [System.Drawing.Color]::FromArgb(12,19,32)
$form.ForeColor = [System.Drawing.Color]::WhiteSmoke
$intro = New-Object System.Windows.Forms.Label
$intro.Text = "Detecte CPU, GPU, placa-mae, RAM, discos e monitores. Revise e salve um arquivo para importar no Meu PC.`r`nO programa nao envia dados. Fonte, cooler e gabinete continuam manuais."
$intro.Location = New-Object System.Drawing.Point(20,18)
$intro.Size = New-Object System.Drawing.Size(760,65)
$intro.Anchor = 'Top,Left,Right'
$scan = New-Object System.Windows.Forms.Button
$scan.Text = '1. Detectar hardware'
$scan.Location = New-Object System.Drawing.Point(20,92)
$scan.Size = New-Object System.Drawing.Size(220,40)
$scan.BackColor = [System.Drawing.Color]::FromArgb(103,232,249)
$scan.ForeColor = [System.Drawing.Color]::Black
$save = New-Object System.Windows.Forms.Button
$save.Text = '2. Salvar arquivo JSON'
$save.Location = New-Object System.Drawing.Point(255,92)
$save.Size = New-Object System.Drawing.Size(230,40)
$save.BackColor = [System.Drawing.Color]::FromArgb(103,232,249)
$save.ForeColor = [System.Drawing.Color]::Black
$save.Enabled = $false
$status = New-Object System.Windows.Forms.Label
$status.Text = 'Pronto. A consulta so comeca quando voce clicar em Detectar.'
$status.Location = New-Object System.Drawing.Point(20,144)
$status.Size = New-Object System.Drawing.Size(760,44)
$status.Anchor = 'Top,Left,Right'
$output = New-Object System.Windows.Forms.TextBox
$output.Multiline = $true
$output.ReadOnly = $true
$output.ScrollBars = 'Both'
$output.WordWrap = $false
$output.Location = New-Object System.Drawing.Point(20,195)
$output.Size = New-Object System.Drawing.Size(760,350)
$output.Anchor = 'Top,Bottom,Left,Right'
$output.BackColor = [System.Drawing.Color]::FromArgb(20,29,44)
$output.ForeColor = [System.Drawing.Color]::WhiteSmoke
$output.Font = New-Object System.Drawing.Font('Consolas',10)
$output.Text = 'O relatorio completo aparecera aqui antes de salvar.'
$footer = New-Object System.Windows.Forms.Label
$footer.Text = 'Sem senhas, arquivos pessoais, nomes de usuario ou numeros de serie. Nenhuma alteracao no hardware.'
$footer.Location = New-Object System.Drawing.Point(20,557)
$footer.Size = New-Object System.Drawing.Size(760,42)
$footer.Anchor = 'Bottom,Left,Right'
$form.Controls.AddRange(@($intro,$scan,$save,$status,$output,$footer))
$scan.Add_Click({
    $scan.Enabled = $false; $save.Enabled = $false
    $script:items.Clear(); $script:notes.Clear()
    try {
        Status 'Consultando processador...'
        foreach ($p in (Read-Cim 'Win32_Processor' @('Name','Manufacturer','NumberOfCores','NumberOfLogicalProcessors'))) {
            Add-Part 'cpu' (Text $p.Name) (Text $p.Manufacturer) '' @{ cores = $p.NumberOfCores; threads = $p.NumberOfLogicalProcessors }
        }
        Status 'Consultando placa-mae...'
        foreach ($p in (Read-Cim 'Win32_BaseBoard' @('Product','Manufacturer'))) { Add-Part 'motherboard' (Text $p.Product) (Text $p.Manufacturer) '' @{} }
        Status 'Consultando video...'
        foreach ($p in (Read-Cim 'Win32_VideoController' @('Name','AdapterCompatibility'))) {
            Add-Part 'gpu' (Text $p.Name) (Text $p.AdapterCompatibility) '' @{}
        }
        [void]$script:notes.Add('GPU: o nome do Windows pode nao indicar fabricante da placa ou variante de VRAM. Confirme manualmente; AdapterRAM nao e usado.')
        Status 'Consultando modulos de memoria...'
        foreach ($p in (Read-Cim 'Win32_PhysicalMemory' @('Manufacturer','PartNumber','Capacity','ConfiguredClockSpeed','SMBIOSMemoryType'))) {
            $type = switch ([int]$p.SMBIOSMemoryType) {
                20 { 'DDR' }
                21 { 'DDR2' }
                24 { 'DDR3' }
                26 { 'DDR4' }
                34 { 'DDR5' }
                default { '' }
            }
            $size = [math]::Round([double]$p.Capacity / 1073741824, 2)
            $pn = Text $p.PartNumber
            $name = "$pn $size GB $type".Trim()
            Add-Part 'memory' $name (Text $p.Manufacturer) $pn @{ capacity = $size; modules = 1; speed = $p.ConfiguredClockSpeed; memoryType = $type }
        }
        Status 'Consultando discos fisicos...'
        foreach ($p in (Read-Cim 'Win32_DiskDrive' @('Model','Manufacturer','Size','InterfaceType'))) {
            Add-Part 'storage' (Text $p.Model) (Text $p.Manufacturer) '' @{ capacity = [math]::Round([double]$p.Size / 1000000000); interface = (Text $p.InterfaceType) }
        }
        [void]$script:notes.Add('Discos externos e virtuais podem aparecer. SCSI e o tipo informado pelo Windows e nao confirma SATA/NVMe; exclua o que nao pertence ao PC.')
        Status 'Consultando monitores...'
        foreach ($p in (Read-Cim 'WmiMonitorID' @('UserFriendlyName','ManufacturerName','ProductCodeID','Active') 'root/wmi')) {
            if ($p.Active) {
                $name = Edid-Text $p.UserFriendlyName
                if (-not $name) { $name = 'Monitor ' + (Edid-Text $p.ProductCodeID) }
                Add-Part 'monitor' $name (Edid-Text $p.ManufacturerName) '' @{}
            }
        }
        [void]$script:notes.Add('Monitores: resolucao, Hz e modelo comercial precisam de confirmacao. Nao associamos a resolucao da GPU a uma tela por suposicao.')
        $script:report = [ordered]@{ kind = 'UpgradePCDetector'; schemaVersion = 1; detectorVersion = '1.0.0'; scannedAt = [DateTime]::UtcNow.ToString('o'); components = @($script:items.ToArray()); warnings = @($script:notes.ToArray()) }
        $output.Text = $script:report | ConvertTo-Json -Depth 7
        $save.Enabled = $script:items.Count -gt 0
        Status ("Consulta concluida: " + $script:items.Count + ' itens. Revise o relatorio antes de salvar.')
    } catch {
        $script:report = $null
        $output.Text = 'Nao foi possivel concluir a consulta. Nenhum arquivo foi enviado. Tente novamente ou use o cadastro manual.'
        Status 'Consulta interrompida.'
    } finally { $scan.Enabled = $true }
})
$save.Add_Click({
    if ($null -eq $script:report) { return }
    $dialog = New-Object System.Windows.Forms.SaveFileDialog
    $dialog.Title = 'Salvar configuracao para o Upgrade PC'
    $dialog.Filter = 'Relatorio Upgrade PC (*.json)|*.json'
    $dialog.FileName = 'upgradepc-config.json'
    $dialog.DefaultExt = 'json'; $dialog.AddExtension = $true; $dialog.OverwritePrompt = $true
    if ($dialog.ShowDialog($form) -eq [System.Windows.Forms.DialogResult]::OK) {
        try {
            [System.IO.File]::WriteAllText($dialog.FileName, ($script:report | ConvertTo-Json -Depth 7), (New-Object System.Text.UTF8Encoding($false)))
            Status 'Arquivo salvo. No site, abra Meu PC > Importar configuracao e escolha esse JSON.'
        } catch { Status 'Nao foi possivel salvar nesse local. Escolha outra pasta.' }
    }
    $dialog.Dispose()
})
[void]$form.ShowDialog()
$form.Dispose()
