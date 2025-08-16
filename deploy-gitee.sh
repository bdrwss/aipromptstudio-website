#!/bin/bash

# AI Prompt Studio 官网 - Gitee Pages 部署脚本
# 专为国内用户优化

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_message $BLUE "=========================================="
print_message $BLUE "   AI Prompt Studio - Gitee Pages 部署"
print_message $BLUE "=========================================="
echo ""

# 检查git
if ! command -v git &> /dev/null; then
    print_message $RED "错误: 未安装 git"
    exit 1
fi

# 检查是否在正确目录
if [ ! -f "index.html" ]; then
    print_message $RED "错误: 请在 website 目录下运行此脚本"
    exit 1
fi

# 获取用户信息
read -p "请输入您的Gitee用户名: " GITEE_USERNAME
read -p "请输入仓库名称 (默认: aipromptstudio-website): " REPO_NAME
REPO_NAME=${REPO_NAME:-aipromptstudio-website}

GITEE_URL="https://gitee.com/${GITEE_USERNAME}/${REPO_NAME}.git"

print_message $YELLOW "配置信息:"
echo "  用户名: $GITEE_USERNAME"
echo "  仓库名: $REPO_NAME"
echo "  仓库地址: $GITEE_URL"
echo ""

read -p "确认部署? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    print_message $YELLOW "部署已取消"
    exit 0
fi

print_message $BLUE "开始部署..."

# 初始化git仓库（如果需要）
if [ ! -d ".git" ]; then
    print_message $YELLOW "初始化 Git 仓库..."
    git init
    git config user.name "$GITEE_USERNAME"
    git config user.email "${GITEE_USERNAME}@gitee.com"
fi

# 添加Gitee远程仓库
if git remote get-url gitee &> /dev/null; then
    print_message $YELLOW "更新 Gitee 远程仓库地址..."
    git remote set-url gitee $GITEE_URL
else
    print_message $YELLOW "添加 Gitee 远程仓库..."
    git remote add gitee $GITEE_URL
fi

# 添加所有文件
print_message $YELLOW "添加文件到Git..."
git add .

# 检查是否有更改
if git diff --staged --quiet; then
    print_message $YELLOW "没有文件更改"
else
    print_message $YELLOW "提交更改..."
    git commit -m "部署 AI Prompt Studio 官网到 Gitee Pages"
fi

# 推送到Gitee
print_message $YELLOW "推送到 Gitee..."
if git push gitee master 2>/dev/null || git push gitee main 2>/dev/null; then
    print_message $GREEN "✓ 代码推送成功！"
else
    print_message $RED "推送失败，请检查仓库地址和权限"
    exit 1
fi

print_message $GREEN "🎉 部署完成！"
echo ""
print_message $BLUE "下一步操作："
echo "1. 访问 https://gitee.com/${GITEE_USERNAME}/${REPO_NAME}"
echo "2. 点击 '服务' -> 'Gitee Pages'"
echo "3. 点击 '启动' 按钮"
echo "4. 等待部署完成（通常1-2分钟）"
echo ""
print_message $GREEN "部署完成后访问地址："
print_message $YELLOW "https://${GITEE_USERNAME}.gitee.io/${REPO_NAME}"
echo ""
print_message $BLUE "提示: 如果页面没有更新，请在Gitee Pages页面点击'更新'按钮"
