@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo        HRM SYSTEM - RESTORE DATABASE (HRM_DB01)
echo ========================================================
echo.

set "PG_BIN=C:\Program Files\PostgreSQL\17\bin"
set "DB_NAME=HRM_DB01"
set "DB_USER=postgres"
set "DB_HOST=127.0.0.1"
set "DB_PORT=5432"
set "PGPASSWORD=123"

if not exist "%~dp0backups" (
    echo [ERROR] Folder 'backups' not found!
    pause
    exit /b
)

set "LATEST_BACKUP="
for /f "delims=" %%F in ('dir "%~dp0backups\*.sql" /b /o-d 2^>nul') do (
    set "LATEST_BACKUP=%~dp0backups\%%F"
    goto :found_file
)

:found_file
if "%LATEST_BACKUP%"=="" (
    echo [ERROR] No backup .sql file found in backups folder!
    pause
    exit /b
)

echo [*] Latest backup file detected:
echo     %LATEST_BACKUP%
echo.
set /p CONFIRM="Are you sure you want to restore to %DB_NAME%? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo [INFO] Restore operation cancelled.
    pause
    exit /b
)

echo.
echo [*] Restoring database %DB_NAME%...
"%PG_BIN%\psql.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%LATEST_BACKUP%"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo  [SUCCESS] Database restored successfully!
    echo ========================================================
) else (
    echo.
    echo [ERROR] Restore encountered an error. Error code: %ERRORLEVEL%
)

echo.
pause
