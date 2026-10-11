@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo        HRM SYSTEM - BACKUP DATABASE (HRM_DB01)
echo ========================================================
echo.

set "PG_BIN=C:\Program Files\PostgreSQL\17\bin"
set "DB_NAME=HRM_DB01"
set "DB_USER=postgres"
set "DB_HOST=127.0.0.1"
set "DB_PORT=5432"
set "PGPASSWORD=123"

if not exist "%~dp0backups" mkdir "%~dp0backups"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "dt=%%I"
if "%dt%"=="" (
    set "TIMESTAMP=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    set "TIMESTAMP=!TIMESTAMP: =0!"
) else (
    set "TIMESTAMP=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%_%dt:~8,2%-%dt:~10,2%-%dt:~12,2%"
)

set "BACKUP_FILE=%~dp0backups\hrm_db_%TIMESTAMP%.sql"

echo [*] Exporting from database: %DB_NAME%...
echo [*] Saving to: %BACKUP_FILE%
echo.

"%PG_BIN%\pg_dump.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -F p -b -f "%BACKUP_FILE%"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo  [SUCCESS] Backup completed successfully!
    echo  [FILE] %BACKUP_FILE%
    echo ========================================================
) else (
    echo.
    echo [ERROR] Backup failed. Error code: %ERRORLEVEL%
)

echo.
pause
