#!/bin/bash

# AI Prompt Studio 官网本地预览脚本 (Linux/Mac)
# 自动检测并启动合适的本地服务器

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 显示标题
echo ""
print_message $BLUE "========================================"
print_message $BLUE "   AI Prompt Studio 官网本地预览"
print_message $BLUE "========================================"
echo ""

# 默认端口
PORT=8000

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_message $YELLOW "端口 $PORT 已被占用，尝试使用端口 $((PORT + 1))"
        PORT=$((PORT + 1))
        check_port
    fi
}

# 检查端口
check_port

# 尝试启动服务器
start_server() {
    local server_type=$1
    local command=$2
    
    print_message $GREEN "[INFO] 使用 $server_type 启动服务器..."
    print_message $BLUE "[INFO] 访问地址: http://localhost:$PORT"
    print_message $YELLOW "[INFO] 按 Ctrl+C 停止服务器"
    echo ""
    
    # 尝试自动打开浏览器
    if command_exists open; then
        # macOS
        sleep 2 && open "http://localhost:$PORT" &
    elif command_exists xdg-open; then
        # Linux
        sleep 2 && xdg-open "http://localhost:$PORT" &
    elif command_exists start; then
        # Windows (Git Bash)
        sleep 2 && start "http://localhost:$PORT" &
    fi
    
    # 执行服务器命令
    eval $command
}

# 检查 Python 3
if command_exists python3; then
    start_server "Python 3" "python3 -m http.server $PORT"
    exit 0
fi

# 检查 Python
if command_exists python; then
    # 检查 Python 版本
    python_version=$(python --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1)
    if [ "$python_version" = "3" ]; then
        start_server "Python 3" "python -m http.server $PORT"
    else
        start_server "Python 2" "python -m SimpleHTTPServer $PORT"
    fi
    exit 0
fi

# 检查 Node.js
if command_exists node; then
    if command_exists npx; then
        start_server "Node.js" "npx serve . -p $PORT"
    elif command_exists npm; then
        print_message $YELLOW "正在安装 serve..."
        npm install -g serve
        start_server "Node.js" "serve . -p $PORT"
    else
        print_message $RED "Node.js 已安装但缺少 npm，请检查安装"
        exit 1
    fi
    exit 0
fi

# 检查 PHP
if command_exists php; then
    start_server "PHP" "php -S localhost:$PORT"
    exit 0
fi

# 检查 Ruby
if command_exists ruby; then
    start_server "Ruby" "ruby -run -e httpd . -p $PORT"
    exit 0
fi

# 如果都没有找到
print_message $RED "[ERROR] 未找到可用的服务器环境！"
echo ""
print_message $YELLOW "请安装以下任意一种环境："
echo "  - Python 3: https://www.python.org/downloads/"
echo "  - Node.js: https://nodejs.org/"
echo "  - PHP: https://www.php.net/downloads"
echo "  - Ruby: https://www.ruby-lang.org/"
echo ""
print_message $BLUE "或者直接在浏览器中打开 index.html 文件"
echo ""

# 尝试直接打开文件
if [ -f "index.html" ]; then
    print_message $YELLOW "尝试直接打开 HTML 文件..."
    if command_exists open; then
        open index.html
    elif command_exists xdg-open; then
        xdg-open index.html
    elif command_exists start; then
        start index.html
    else
        print_message $BLUE "请手动在浏览器中打开 index.html 文件"
    fi
fi

exit 1
