#!/bin/bash

# AI Prompt Studio 官网部署脚本
# 支持多种部署方式：GitHub Pages, Netlify, Vercel 等

set -e  # 遇到错误立即退出

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

# 显示帮助信息
show_help() {
    echo "AI Prompt Studio 官网部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  -t, --type TYPE     部署类型 (github|netlify|vercel|local)"
    echo "  -d, --domain DOMAIN 自定义域名"
    echo "  -b, --branch BRANCH Git 分支名 (默认: main)"
    echo "  -m, --message MSG   提交消息"
    echo ""
    echo "部署类型:"
    echo "  github    部署到 GitHub Pages"
    echo "  netlify   部署到 Netlify"
    echo "  vercel    部署到 Vercel"
    echo "  local     本地预览服务器"
    echo ""
    echo "示例:"
    echo "  $0 -t github -m \"更新官网内容\""
    echo "  $0 -t local"
    echo "  $0 -t netlify -d aipromptstudio.com"
}

# 默认参数
DEPLOY_TYPE=""
CUSTOM_DOMAIN=""
GIT_BRANCH="main"
COMMIT_MESSAGE="Deploy website updates"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--type)
            DEPLOY_TYPE="$2"
            shift 2
            ;;
        -d|--domain)
            CUSTOM_DOMAIN="$2"
            shift 2
            ;;
        -b|--branch)
            GIT_BRANCH="$2"
            shift 2
            ;;
        -m|--message)
            COMMIT_MESSAGE="$2"
            shift 2
            ;;
        *)
            print_message $RED "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 如果没有指定部署类型，显示选择菜单
if [[ -z "$DEPLOY_TYPE" ]]; then
    print_message $BLUE "请选择部署类型:"
    echo "1) GitHub Pages"
    echo "2) Netlify"
    echo "3) Vercel"
    echo "4) 本地预览"
    echo "5) 退出"
    
    read -p "请输入选择 (1-5): " choice
    
    case $choice in
        1) DEPLOY_TYPE="github" ;;
        2) DEPLOY_TYPE="netlify" ;;
        3) DEPLOY_TYPE="vercel" ;;
        4) DEPLOY_TYPE="local" ;;
        5) exit 0 ;;
        *) 
            print_message $RED "无效选择"
            exit 1
            ;;
    esac
fi

# 检查必要的文件
check_files() {
    local required_files=("index.html" "styles.css" "script.js")
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            print_message $RED "错误: 找不到必要文件 $file"
            exit 1
        fi
    done
    
    print_message $GREEN "✓ 所有必要文件检查通过"
}

# 优化文件（可选）
optimize_files() {
    print_message $YELLOW "正在优化文件..."
    
    # 如果有 htmlmin，压缩 HTML
    if command_exists htmlmin; then
        htmlmin index.html index.html.min
        mv index.html.min index.html
        print_message $GREEN "✓ HTML 文件已压缩"
    fi
    
    # 如果有 csso，压缩 CSS
    if command_exists csso; then
        csso styles.css --output styles.css
        print_message $GREEN "✓ CSS 文件已压缩"
    fi
    
    # 如果有 terser，压缩 JavaScript
    if command_exists terser; then
        terser script.js --compress --mangle --output script.js
        print_message $GREEN "✓ JavaScript 文件已压缩"
    fi
}

# GitHub Pages 部署
deploy_github() {
    print_message $BLUE "开始部署到 GitHub Pages..."
    
    if ! command_exists git; then
        print_message $RED "错误: 未找到 git 命令"
        exit 1
    fi
    
    # 检查是否在 git 仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_message $RED "错误: 当前目录不是 git 仓库"
        exit 1
    fi
    
    # 添加所有文件
    git add .
    
    # 提交更改
    if git diff --staged --quiet; then
        print_message $YELLOW "没有文件更改，跳过提交"
    else
        git commit -m "$COMMIT_MESSAGE"
        print_message $GREEN "✓ 文件已提交"
    fi
    
    # 推送到远程仓库
    git push origin "$GIT_BRANCH"
    print_message $GREEN "✓ 已推送到 GitHub"
    
    # 如果有自定义域名，创建 CNAME 文件
    if [[ -n "$CUSTOM_DOMAIN" ]]; then
        echo "$CUSTOM_DOMAIN" > CNAME
        git add CNAME
        git commit -m "Add CNAME for custom domain"
        git push origin "$GIT_BRANCH"
        print_message $GREEN "✓ 自定义域名已配置: $CUSTOM_DOMAIN"
    fi
    
    print_message $GREEN "🎉 GitHub Pages 部署完成！"
    print_message $BLUE "访问: https://$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\)\/\([^.]*\).*/\1.github.io\/\2/')"
}

# Netlify 部署
deploy_netlify() {
    print_message $BLUE "开始部署到 Netlify..."
    
    if ! command_exists netlify; then
        print_message $YELLOW "正在安装 Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    # 构建和部署
    netlify deploy --prod --dir .
    
    print_message $GREEN "🎉 Netlify 部署完成！"
}

# Vercel 部署
deploy_vercel() {
    print_message $BLUE "开始部署到 Vercel..."
    
    if ! command_exists vercel; then
        print_message $YELLOW "正在安装 Vercel CLI..."
        npm install -g vercel
    fi
    
    # 部署
    vercel --prod
    
    print_message $GREEN "🎉 Vercel 部署完成！"
}

# 本地预览
local_preview() {
    print_message $BLUE "启动本地预览服务器..."
    
    local port=8000
    
    # 尝试不同的服务器
    if command_exists python3; then
        print_message $GREEN "使用 Python 3 服务器"
        python3 -m http.server $port
    elif command_exists python; then
        print_message $GREEN "使用 Python 2 服务器"
        python -m SimpleHTTPServer $port
    elif command_exists node; then
        if command_exists npx; then
            print_message $GREEN "使用 Node.js 服务器"
            npx serve . -p $port
        else
            print_message $RED "请安装 serve: npm install -g serve"
            exit 1
        fi
    elif command_exists php; then
        print_message $GREEN "使用 PHP 服务器"
        php -S localhost:$port
    else
        print_message $RED "未找到可用的服务器，请安装 Python、Node.js 或 PHP"
        exit 1
    fi
}

# 主函数
main() {
    print_message $BLUE "AI Prompt Studio 官网部署工具"
    print_message $BLUE "================================"
    
    # 检查文件
    check_files
    
    # 根据部署类型执行相应操作
    case $DEPLOY_TYPE in
        github)
            deploy_github
            ;;
        netlify)
            deploy_netlify
            ;;
        vercel)
            deploy_vercel
            ;;
        local)
            local_preview
            ;;
        *)
            print_message $RED "未知的部署类型: $DEPLOY_TYPE"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main
