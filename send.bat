@echo off
setlocal

:: Settings
set TAR_NAME=html.tar
set REMOTE_USER=root
set REMOTE_HOST=60.205.227.108
set REMOTE_TARGET_DIR=/var/www/html/tblog

:: Step 1: Clean and generate hexo site
call hexo clean
call hexo generate

:: Step 2: Prepare tar
rmdir /s /q html 2>nul
xcopy public html /E /I /Y >nul

if exist %TAR_NAME% del %TAR_NAME%
tar -cf %TAR_NAME% html

:: Step 3: Upload tar to server
scp %TAR_NAME% %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_TARGET_DIR%/

:: Step 4: Clean local temp files
del %TAR_NAME%
rmdir /s /q html

endlocal
