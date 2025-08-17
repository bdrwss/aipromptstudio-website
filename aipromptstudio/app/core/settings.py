#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
全局配置和设置模块
定义项目中的全局常量和配置项
"""

import os
import json

# 项目根目录
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 数据目录
DATA_ROOT = os.path.join(PROJECT_ROOT, "data")

# 数据库配置
DATABASE_PATH = os.path.join(DATA_ROOT, "aipromptstudio.db")

# 媒体文件存储目录
MEDIA_ROOT = os.path.join(DATA_ROOT, "media")

# 备份目录
BACKUP_ROOT = os.path.join(DATA_ROOT, "backup")

# 日志目录
LOG_ROOT = os.path.join(DATA_ROOT, "logs")

# 配置目录
CONFIG_ROOT = os.path.join(DATA_ROOT, "config")

# 云备份状态目录
CLOUD_STATE_ROOT = os.path.join(DATA_ROOT, "cloud_state")

# 用户配置文件路径
USER_CONFIG_FILE = os.path.join(CONFIG_ROOT, "user_config.json")

# 确保必要的目录存在
for directory in [os.path.dirname(DATABASE_PATH), MEDIA_ROOT, BACKUP_ROOT, LOG_ROOT, CONFIG_ROOT, CLOUD_STATE_ROOT]:
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)

# 应用程序设置
APP_NAME = "AI Prompt Studio"
APP_VERSION = "1.2.0"
APP_AUTHOR = "AI Prompt Studio Team"

# 窗口默认尺寸
DEFAULT_WINDOW_WIDTH = 1200
DEFAULT_WINDOW_HEIGHT = 800

# 主题设置
DEFAULT_THEME = "light"  # 默认主题: light 或 dark

# 数据库默认设置
DEFAULT_PAGE_SIZE = 20  # 默认分页大小

# 媒体处理设置
THUMBNAIL_SIZE = (200, 200)  # 缩略图尺寸
MAX_IMAGE_SIZE = (1920, 1080)  # 最大图片尺寸

# 备份设置
AUTO_BACKUP_ENABLED = True  # 是否启用自动备份
AUTO_BACKUP_INTERVAL = 30  # 自动备份间隔（分钟）
MAX_BACKUP_COUNT = 10  # 最大备份数量


def load_user_config():
    """
    加载用户配置
    
    Returns:
        dict: 用户配置字典
    """
    # 默认配置
    config = {
        "theme": DEFAULT_THEME,
        "is_topmost": False
    }
    
    # 如果配置文件存在，则加载配置
    if os.path.exists(USER_CONFIG_FILE):
        try:
            with open(USER_CONFIG_FILE, 'r', encoding='utf-8') as f:
                user_config = json.load(f)
                config.update(user_config)
        except (json.JSONDecodeError, IOError):
            # 如果读取或解析配置文件失败，使用默认配置
            pass
    
    return config


def save_user_config(config):
    """
    保存用户配置
    
    Args:
        config (dict): 用户配置字典
    """
    try:
        with open(USER_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=4)
    except IOError:
        # 如果保存配置文件失败，忽略错误
        pass