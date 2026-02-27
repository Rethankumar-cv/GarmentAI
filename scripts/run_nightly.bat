@echo off
REM run_nightly.bat — Windows Task Scheduler script for nightly pipeline run
REM
REM Schedule this with Windows Task Scheduler:
REM   Action: Run Program
REM   Program: D:\GarmentsInsights_AI\GarmentsInsights_AI\scripts\run_nightly.bat
REM   Start in: D:\GarmentsInsights_AI\GarmentsInsights_AI
REM
REM Or in PowerShell, register with:
REM   schtasks /Create /TN "GarmentsAI_Pipeline" /TR "D:\GarmentsInsights_AI\GarmentsInsights_AI\scripts\run_nightly.bat" /SC DAILY /ST 02:00

SET PROJECT_DIR=D:\GarmentsInsights_AI\GarmentsInsights_AI
SET PYTHON=%PROJECT_DIR%\venv\Scripts\python.exe
SET LOG_FILE=%PROJECT_DIR%\analytics\pipeline_logs\nightly.log

echo [%DATE% %TIME%] Starting nightly pipeline... >> "%LOG_FILE%"

cd /d "%PROJECT_DIR%"

REM Run ETL pipeline (no retrain — use --retrain for weekly retraining)
"%PYTHON%" -m data_pipeline.pipeline >> "%LOG_FILE%" 2>&1

IF %ERRORLEVEL% EQU 0 (
    echo [%DATE% %TIME%] Pipeline completed successfully. >> "%LOG_FILE%"
) ELSE (
    echo [%DATE% %TIME%] Pipeline FAILED with exit code %ERRORLEVEL%. >> "%LOG_FILE%"
)

echo. >> "%LOG_FILE%"
