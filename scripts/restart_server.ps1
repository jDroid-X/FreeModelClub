$port = 12247
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 1
$startClass = [WMICLASS]"ROOT\CIMV2:Win32_Process"
$result = $startClass.Create("node server.js", "c:\Users\jiten\jAnitGravity\FreeModelsClub", $null)
if ($result.ReturnValue -eq 0) {
    Write-Host "Server restarted with PID " $result.ProcessId
} else {
    Write-Host "Failed to restart server"
}
