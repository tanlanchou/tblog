@echo off
setlocal

:: 设置远程服务器信息
set REMOTE_USER=root
set REMOTE_HOST=60.205.227.108
set REMOTE_DIR=/root/project/tblog

:: 设置本地文件夹
set LOCAL_DIR=.deploy_git

:: 使用scp命令复制文件夹到远程服务器
scp -r %LOCAL_DIR% %REMOTE_USER%@%REMOTE_HOST%:%REMOTE_DIR%

endlocal