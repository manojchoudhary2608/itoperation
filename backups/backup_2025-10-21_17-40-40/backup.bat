@echo off
echo Creating backup of IT Operations Portal application...
echo.

REM --- Configuration ---
set "SOURCE_DIR=%~dp0"
if "%SOURCE_DIR:~-1%"=="\" set "SOURCE_DIR=%SOURCE_DIR:~0,-1%"
set "BACKUP_ROOT=%~dp0"

REM --- Create a timestamp ---
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "MIN=%dt:~10,2%"
set "SEC=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%MIN%-%SEC%"
set "BACKUP_DIR=%BACKUP_ROOT%backup_%timestamp%"

echo Source to back up: %SOURCE_DIR%
echo Backup will be saved to: %BACKUP_DIR%
echo.

echo Creating backup directory...
mkdir "%BACKUP_DIR%"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create backup directory.
    goto end
)
echo.

echo Copying files...

REM Copy database file
robocopy "%SOURCE_DIR%\server" "%BACKUP_DIR%\server" database.db /NFL /NDL /NJH /NJS /nc /ns /np

REM Copy server directory, excluding node_modules and public (which contains client/build)
robocopy "%SOURCE_DIR%\server" "%BACKUP_DIR%\server" /E /XD node_modules public /NFL /NDL /NJH /NJS /nc /ns /np

REM Copy client directory, excluding node_modules and build (as build is already in server/public)
robocopy "%SOURCE_DIR%\client" "%BACKUP_DIR%\client" /E /XD node_modules build /NFL /NDL /NJH /NJS /nc /ns /np

REM Copy web.config from server directory (explicit copy)
robocopy "%SOURCE_DIR%\server" "%BACKUP_DIR%\server" web.config /NFL /NDL /NJH /NJS /nc /ns /np

REM Copy root directory files (only backup.bat itself for now)
robocopy "%SOURCE_DIR%" "%BACKUP_DIR%" backup.bat /NFL /NDL /NJH /NJS /nc /ns /np

if %errorlevel% geq 4 (
    echo ERROR: File copy failed.
    goto end
)
echo.

echo --- BACKUP COMPLETE ---
:end
echo.
pause