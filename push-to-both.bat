@echo off
REM Script to push current branch to both GitHub repositories
REM Usage: push-to-both.bat [branch-name]
REM If no branch name is provided, uses current branch

if "%1"=="" (
    for /f "tokens=*" %%b in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%b
) else (
    set BRANCH=%1
)

echo Pushing %BRANCH% to both repositories...
echo.

echo [1/2] Pushing to origin (original repo)...
git push origin %BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to push to origin
    exit /b 1
)

echo.
echo [2/2] Pushing to main-project (new repo)...
git push main-project %BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to push to main-project
    exit /b 1
)

echo.
echo Successfully pushed %BRANCH% to both repositories!
pause


