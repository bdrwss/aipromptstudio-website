@echo off
REM AI Prompt Studio 官网本地预览脚本 (Windows)
REM 自动检测并启动合适的本地服务器

echo.
echo ========================================
echo   AI Prompt Studio 官网本地预览
echo ========================================
echo.

REM 检查 Python 3
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [INFO] 使用 Python 启动服务器...
    echo [INFO] 访问地址: http://localhost:8000
    echo [INFO] 按 Ctrl+C 停止服务器
    echo.
    python -m http.server 8000
    goto :end
)

REM 检查 Python 2
python2 --version >nul 2>&1
if %errorlevel% == 0 (
    echo [INFO] 使用 Python 2 启动服务器...
    echo [INFO] 访问地址: http://localhost:8000
    echo [INFO] 按 Ctrl+C 停止服务器
    echo.
    python2 -m SimpleHTTPServer 8000
    goto :end
)

REM 检查 Node.js
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo [INFO] 使用 Node.js 启动服务器...
    echo [INFO] 访问地址: http://localhost:8000
    echo [INFO] 按 Ctrl+C 停止服务器
    echo.
    npx serve . -p 8000
    goto :end
)

REM 检查 PHP
php --version >nul 2>&1
if %errorlevel% == 0 (
    echo [INFO] 使用 PHP 启动服务器...
    echo [INFO] 访问地址: http://localhost:8000
    echo [INFO] 按 Ctrl+C 停止服务器
    echo.
    php -S localhost:8000
    goto :end
)

REM 如果都没有找到
echo [ERROR] 未找到可用的服务器环境！
echo.
echo 请安装以下任意一种环境：
echo   - Python 3: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo   - PHP: https://www.php.net/downloads
echo.
echo 或者直接在浏览器中打开 index.html 文件
echo.
pause

:end
echo.
echo 服务器已停止
pause
