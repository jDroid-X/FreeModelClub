' ================================================================================
' FreeModelsClub Silent VBScript Launcher
' Launches Launch_FMC.bat in completely hidden window (WindowStyle = 0)
' ================================================================================
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c ..\Launch_FMC.bat", 0, False
