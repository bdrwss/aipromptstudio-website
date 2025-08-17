@echo off
chcp 65001 >nul
title AI Prompt Studio - 便携版制作工具

echo.
echo ========================================================
echo 💼 AI Prompt Studio 便携版制作工具
echo ========================================================
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 检查目录版本是否存在
if not exist "dist\AI_Prompt_Studio" (
    echo ❌ 错误：未找到目录版本！
    echo.
    echo 请先运行以下脚本之一来构建目录版本：
    echo - 制作目录版本.bat
    echo - python build_installer.py
    echo.
    pause
    exit /b 1
)

echo ✅ 找到目录版本：dist\AI_Prompt_Studio
echo.

REM 获取版本信息
set "VERSION=1.2.0"
for /f "tokens=*" %%i in ('powershell -command "(Get-Item 'dist\AI_Prompt_Studio\AI_Prompt_Studio.exe').VersionInfo.FileVersion"') do (
    if not "%%i"=="" set "VERSION=%%i"
)

echo 📋 便携版信息：
echo - 应用名称：AI Prompt Studio
echo - 版本号：%VERSION%
echo - 类型：便携版（免安装）
echo - 目标平台：Windows 10/11
echo.

REM 计算目录大小
for /f %%i in ('powershell -command "(Get-ChildItem -Path 'dist\AI_Prompt_Studio' -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB"') do (
    set "DIR_SIZE=%%i"
)

echo 📊 目录统计：
echo - 目录大小：%DIR_SIZE% MB
echo - 预计ZIP大小：约 %DIR_SIZE%/3 MB
echo.

REM 确认制作便携版
set /p confirm=是否制作便携版？(Y/N): 
if /i not "%confirm%"=="Y" (
    echo 取消便携版制作
    pause
    exit /b 0
)

echo.
echo 🚀 开始制作便携版...
echo.

REM 创建便携版目录
set "PORTABLE_DIR=AI_Prompt_Studio_v%VERSION%_Portable"
if exist "%PORTABLE_DIR%" (
    echo 🧹 清理旧的便携版目录...
    rmdir /s /q "%PORTABLE_DIR%"
)

echo 📁 创建便携版目录：%PORTABLE_DIR%
mkdir "%PORTABLE_DIR%"

echo 📋 复制应用程序文件...
xcopy "dist\AI_Prompt_Studio\*" "%PORTABLE_DIR%\" /E /I /H /Y >nul

if errorlevel 1 (
    echo ❌ 文件复制失败！
    pause
    exit /b 1
)

echo ✅ 应用程序文件复制完成

REM 创建便携版说明文件
echo 📝 创建便携版说明文件...

echo # AI Prompt Studio v%VERSION% 便携版 > "%PORTABLE_DIR%\便携版说明.txt"
echo. >> "%PORTABLE_DIR%\便携版说明.txt"
echo ## 🚀 使用说明 >> "%PORTABLE_DIR%\便携版说明.txt"
echo 1. 双击运行 AI_Prompt_Studio.exe 启动程序 >> "%PORTABLE_DIR%\便携版说明.txt"
echo 2. 首次运行会在当前目录创建 data 文件夹存储数据 >> "%PORTABLE_DIR%\便携版说明.txt"
echo 3. 所有数据和配置都保存在程序目录下，便于携带 >> "%PORTABLE_DIR%\便携版说明.txt"
echo. >> "%PORTABLE_DIR%\便携版说明.txt"
echo ## 💻 系统要求 >> "%PORTABLE_DIR%\便携版说明.txt"
echo - Windows 10 或更高版本 (x64) >> "%PORTABLE_DIR%\便携版说明.txt"
echo - 4GB RAM 或更高 >> "%PORTABLE_DIR%\便携版说明.txt"
echo - 500MB 可用磁盘空间 >> "%PORTABLE_DIR%\便携版说明.txt"
echo - 1024x768 分辨率或更高 >> "%PORTABLE_DIR%\便携版说明.txt"
echo. >> "%PORTABLE_DIR%\便携版说明.txt"
echo ## ✨ 便携版特性 >> "%PORTABLE_DIR%\便携版说明.txt"
echo - 免安装，解压即用 >> "%PORTABLE_DIR%\便携版说明.txt"
echo - 数据存储在程序目录 >> "%PORTABLE_DIR%\便携版说明.txt"
echo - 可在U盘等移动设备上运行 >> "%PORTABLE_DIR%\便携版说明.txt"
echo - 不在系统中留下注册表项 >> "%PORTABLE_DIR%\便携版说明.txt"
echo - 删除文件夹即可完全卸载 >> "%PORTABLE_DIR%\便携版说明.txt"
echo. >> "%PORTABLE_DIR%\便携版说明.txt"
echo ## 📞 技术支持 >> "%PORTABLE_DIR%\便携版说明.txt"
echo - 邮箱: zcc9634@gmail.com >> "%PORTABLE_DIR%\便携版说明.txt"
echo - GitHub: https://github.com/bdrwss/aipromptstudio >> "%PORTABLE_DIR%\便携版说明.txt"
echo. >> "%PORTABLE_DIR%\便携版说明.txt"
echo ## 📄 版权信息 >> "%PORTABLE_DIR%\便携版说明.txt"
echo © 2024 AI Prompt Studio. 版权归摆渡人吾师带领的开发团队所有。 >> "%PORTABLE_DIR%\便携版说明.txt"

echo ✅ 便携版说明文件创建完成

REM 创建启动脚本（可选）
echo 📝 创建启动脚本...

echo @echo off > "%PORTABLE_DIR%\启动 AI Prompt Studio.bat"
echo title AI Prompt Studio >> "%PORTABLE_DIR%\启动 AI Prompt Studio.bat"
echo cd /d "%%~dp0" >> "%PORTABLE_DIR%\启动 AI Prompt Studio.bat"
echo start "" "AI_Prompt_Studio.exe" >> "%PORTABLE_DIR%\启动 AI Prompt Studio.bat"

echo ✅ 启动脚本创建完成

REM 检查是否有7-Zip或WinRAR来创建压缩包
echo.
echo 🗜️ 检查压缩工具...

set "COMPRESS_TOOL="
if exist "C:\Program Files\7-Zip\7z.exe" (
    set "COMPRESS_TOOL=C:\Program Files\7-Zip\7z.exe"
    set "COMPRESS_TYPE=7-Zip"
) else if exist "C:\Program Files (x86)\7-Zip\7z.exe" (
    set "COMPRESS_TOOL=C:\Program Files (x86)\7-Zip\7z.exe"
    set "COMPRESS_TYPE=7-Zip"
) else if exist "C:\Program Files\WinRAR\WinRAR.exe" (
    set "COMPRESS_TOOL=C:\Program Files\WinRAR\WinRAR.exe"
    set "COMPRESS_TYPE=WinRAR"
) else if exist "C:\Program Files (x86)\WinRAR\WinRAR.exe" (
    set "COMPRESS_TOOL=C:\Program Files (x86)\WinRAR\WinRAR.exe"
    set "COMPRESS_TYPE=WinRAR"
)

if "%COMPRESS_TOOL%"=="" (
    echo ⚠️ 未找到压缩工具（7-Zip或WinRAR）
    echo 💡 您可以手动压缩 %PORTABLE_DIR% 文件夹
) else (
    echo ✅ 找到压缩工具：%COMPRESS_TYPE%
    
    set /p create_zip=是否创建ZIP压缩包？(Y/N): 
    if /i "!create_zip!"=="Y" (
        echo 🗜️ 正在创建压缩包...
        
        if "%COMPRESS_TYPE%"=="7-Zip" (
            "%COMPRESS_TOOL%" a -tzip "%PORTABLE_DIR%.zip" "%PORTABLE_DIR%\*" >nul
        ) else (
            "%COMPRESS_TOOL%" a -afzip "%PORTABLE_DIR%.zip" "%PORTABLE_DIR%\*" >nul
        )
        
        if exist "%PORTABLE_DIR%.zip" (
            for %%A in ("%PORTABLE_DIR%.zip") do set "ZIP_SIZE=%%~zA"
            set /a "ZIP_SIZE_MB=!ZIP_SIZE! / 1048576"
            echo ✅ 压缩包创建完成：%PORTABLE_DIR%.zip
            echo 📊 压缩包大小：!ZIP_SIZE_MB! MB
        ) else (
            echo ❌ 压缩包创建失败
        )
    )
)

echo.
echo 🎉 便携版制作完成！
echo.
echo 📁 便携版目录：%PORTABLE_DIR%\
echo 🚀 主程序：%PORTABLE_DIR%\AI_Prompt_Studio.exe
echo 📄 说明文件：%PORTABLE_DIR%\便携版说明.txt
echo 🔧 启动脚本：%PORTABLE_DIR%\启动 AI Prompt Studio.bat

if exist "%PORTABLE_DIR%.zip" (
    echo 📦 压缩包：%PORTABLE_DIR%.zip
)

echo.
echo 💡 分发说明：
echo - 将便携版文件夹或ZIP文件分发给用户
echo - 用户解压后直接运行即可使用
echo - 无需安装，删除文件夹即可卸载
echo - 适合在U盘等移动设备上使用
echo.

REM 询问是否打开便携版目录
set /p open_folder=是否打开便携版目录？(Y/N): 
if /i "%open_folder%"=="Y" (
    explorer "%PORTABLE_DIR%"
)

REM 询问是否测试运行
echo.
set /p test_run=是否测试运行便携版？(Y/N): 
if /i "%test_run%"=="Y" (
    echo 正在启动便携版...
    start "" "%PORTABLE_DIR%\AI_Prompt_Studio.exe"
)

echo.
echo 感谢使用AI Prompt Studio便携版制作工具！
echo.
pause
