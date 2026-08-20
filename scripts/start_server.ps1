$rootDir = (Get-Item .).FullName
$startClass = [WMICLASS]"ROOT\CIMV2:Win32_Process"
$result = $startClass.Create("node server.js", $rootDir, $null)
Start-Sleep -Seconds 2
netstat -ano | Select-String ":12247 "
