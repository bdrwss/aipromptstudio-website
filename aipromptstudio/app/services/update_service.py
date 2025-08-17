#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
软件更新服务
处理版本检查、下载和安装等更新功能
"""

import os
import json
import requests
import hashlib
import tempfile
import subprocess
import threading
from pathlib import Path
from typing import Dict, Optional, Callable
from urllib.parse import urljoin

from PySide6.QtCore import QObject, Signal, QThread
from app.services.base_service import BaseService
from app.core.service_result import ServiceResult


class UpdateInfo:
    """更新信息类"""
    
    def __init__(self, data: dict):
        self.version = data.get('version', '')
        self.build = data.get('build', 0)
        self.release_date = data.get('release_date', '')
        self.description = data.get('description', '')
        self.changes = data.get('changes', [])
        self.download_url = data.get('download_url', '')
        self.file_size = data.get('file_size', 0)
        self.checksum = data.get('checksum', '')
        self.force_update = data.get('force_update', False)
        self.min_version = data.get('min_version', '')
        
    def is_newer_than(self, current_version: str) -> bool:
        """检查是否是更新版本"""
        try:
            current_parts = [int(x) for x in current_version.split('.')]
            new_parts = [int(x) for x in self.version.split('.')]
            
            # 补齐版本号长度
            max_len = max(len(current_parts), len(new_parts))
            current_parts.extend([0] * (max_len - len(current_parts)))
            new_parts.extend([0] * (max_len - len(new_parts)))
            
            for i in range(max_len):
                if new_parts[i] > current_parts[i]:
                    return True
                elif new_parts[i] < current_parts[i]:
                    return False
            
            return False
        except:
            return False


class UpdateCheckWorker(QThread):
    """更新检查工作线程"""
    
    update_available = Signal(object)  # UpdateInfo
    no_update = Signal()
    error_occurred = Signal(str)
    
    def __init__(self, update_url: str, current_version: str):
        super().__init__()
        self.update_url = update_url
        self.current_version = current_version
        
    def run(self):
        """执行更新检查"""
        try:
            # 发送请求检查更新
            headers = {
                'User-Agent': f'AI-Prompt-Studio/{self.current_version}',
                'Content-Type': 'application/json'
            }

            # 添加必需的请求参数
            params = {
                'current_version': self.current_version,
                'platform': 'windows',
                'arch': 'x64'
            }

            response = requests.get(self.update_url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            
            update_data = response.json()
            update_info = UpdateInfo(update_data)

            # 检查是否有更新：只有当版本确实更新时才显示更新对话框
            if update_info.is_newer_than(self.current_version):
                self.update_available.emit(update_info)
            else:
                # 版本相同或更旧时，不显示更新对话框
                self.no_update.emit()
                
        except requests.RequestException as e:
            self.error_occurred.emit(f"网络请求失败: {str(e)}")
        except json.JSONDecodeError as e:
            self.error_occurred.emit(f"更新信息解析失败: {str(e)}")
        except Exception as e:
            self.error_occurred.emit(f"检查更新失败: {str(e)}")


class UpdateDownloadWorker(QThread):
    """更新下载工作线程"""
    
    download_progress = Signal(int, int, int)  # downloaded, total, percentage
    download_completed = Signal(str)  # file_path
    download_failed = Signal(str)
    
    def __init__(self, download_url: str, checksum: str = None):
        super().__init__()
        self.download_url = download_url
        self.checksum = checksum
        self.download_path = None
        self._cancelled = False
        
    def run(self):
        """执行下载"""
        try:
            # 创建临时文件
            temp_dir = tempfile.gettempdir()
            filename = os.path.basename(self.download_url) or 'update.exe'
            self.download_path = os.path.join(temp_dir, f"ai_prompt_studio_update_{filename}")
            
            # 开始下载
            response = requests.get(self.download_url, stream=True, timeout=30)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            downloaded_size = 0
            
            with open(self.download_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if self._cancelled:
                        return
                    
                    if chunk:
                        f.write(chunk)
                        downloaded_size += len(chunk)
                        
                        if total_size > 0:
                            percentage = int((downloaded_size / total_size) * 100)
                            self.download_progress.emit(downloaded_size, total_size, percentage)
            
            # 验证文件完整性
            if self.checksum and not self._verify_checksum():
                self.download_failed.emit("文件校验失败，下载的文件可能已损坏")
                return
            
            self.download_completed.emit(self.download_path)
            
        except requests.RequestException as e:
            self.download_failed.emit(f"下载失败: {str(e)}")
        except Exception as e:
            self.download_failed.emit(f"下载过程中发生错误: {str(e)}")
    
    def _verify_checksum(self) -> bool:
        """验证文件校验和"""
        try:
            with open(self.download_path, 'rb') as f:
                file_hash = hashlib.sha256(f.read()).hexdigest()
            return file_hash.lower() == self.checksum.lower()
        except:
            return False
    
    def cancel(self):
        """取消下载"""
        self._cancelled = True


class UpdateService(BaseService):
    """更新服务类"""
    
    def __init__(self, db_manager, config_manager=None):
        super().__init__(db_manager)
        self.config_manager = config_manager
        self.current_version = "1.2.0"  # 从配置文件或其他地方获取当前版本

        # 更新设置 - 强制启用自动更新
        self.auto_check_enabled = True  # 强制启用，不允许用户禁用
        self.check_interval_hours = 6   # 更频繁的检查间隔
        self.update_server_url = "https://aipromptstudio-updates.vercel.app/api/check"
        self.force_update = True        # 强制更新模式
        self.auto_download = True       # 自动下载更新
        self.auto_install = False       # 不自动安装（需要用户确认）
        self.check_on_startup = True    # 启动时检查
        self.notify_available = True    # 通知可用更新
        self.last_check_time = None

        # 工作线程
        self.check_worker = None
        self.download_worker = None

        # 定时器
        self.update_timer = None

        # 加载设置
        self._load_settings()

        # 初始化定时器
        self._init_timer()
    
    def _load_settings(self):
        """加载更新设置（强制启用自动更新）"""
        try:
            if self.config_manager:
                # 强制设置自动更新为启用状态，忽略用户配置
                self.auto_check_enabled = True  # 强制启用
                self.check_interval_hours = min(self.config_manager.get("check_interval_hours", 6, "update"), 6)  # 最多6小时检查一次
                self.update_server_url = self.config_manager.get("server_url", "https://aipromptstudio-updates.vercel.app/api/check", "update")
                self.force_update = True  # 强制更新
                self.auto_download = True  # 强制自动下载
                self.auto_install = self.config_manager.get("auto_install", False, "update")
                self.check_on_startup = True  # 强制启动时检查

                # 强制保存这些设置到配置文件
                self.config_manager.set("auto_check_enabled", True, "update")
                self.config_manager.set("force_update", True, "update")
                self.config_manager.set("auto_download", True, "update")
                self.config_manager.set("check_on_startup", True, "update")
                self.notify_available = self.config_manager.get("notify_available", True, "update")
                self.last_check_time = self.config_manager.get("last_check_time", None, "update")

                self.logger.debug(f"已加载更新设置: 自动检查={self.auto_check_enabled}, 间隔={self.check_interval_hours}小时")
        except Exception as e:
            self.logger.warning(f"加载更新设置失败: {e}")

    def _save_settings(self):
        """保存更新设置"""
        try:
            if self.config_manager:
                self.config_manager.set("auto_check_enabled", self.auto_check_enabled, "update")
                self.config_manager.set("check_interval_hours", self.check_interval_hours, "update")
                self.config_manager.set("server_url", self.update_server_url, "update")
                self.config_manager.set("force_update", self.force_update, "update")
                self.config_manager.set("auto_download", self.auto_download, "update")
                self.config_manager.set("auto_install", self.auto_install, "update")
                self.config_manager.set("check_on_startup", self.check_on_startup, "update")
                self.config_manager.set("notify_available", self.notify_available, "update")
                self.config_manager.set("last_check_time", self.last_check_time, "update")

                self.logger.debug("更新设置已保存")
        except Exception as e:
            self.logger.error(f"保存更新设置失败: {e}")

    def _init_timer(self):
        """初始化定时器"""
        try:
            from PySide6.QtCore import QTimer

            if self.update_timer:
                self.update_timer.stop()
                self.update_timer = None

            if self.auto_check_enabled and self.check_interval_hours > 0:
                self.update_timer = QTimer()
                self.update_timer.timeout.connect(self._periodic_update_check)
                # 转换为毫秒
                interval_ms = self.check_interval_hours * 60 * 60 * 1000
                self.update_timer.start(interval_ms)
                self.logger.info(f"定时更新检查已启动，间隔: {self.check_interval_hours}小时")
        except Exception as e:
            self.logger.error(f"初始化定时器失败: {e}")

    def _periodic_update_check(self):
        """定期更新检查"""
        try:
            self.logger.debug("执行定期更新检查")
            self.check_for_updates()
        except Exception as e:
            self.logger.error(f"定期更新检查失败: {e}")

    def set_auto_check_enabled(self, enabled: bool):
        """设置自动检查更新状态（强制启用，忽略用户输入）"""
        # 强制启用自动检查，忽略传入的参数
        self.auto_check_enabled = True
        self.logger.info("自动检查更新已强制启用，用户无法禁用")
        self._save_settings()
        self._init_timer()  # 重新初始化定时器

    def set_check_interval(self, hours: int):
        """设置检查间隔"""
        if hours < 1 or hours > 168:  # 1小时到7天
            raise ValueError("检查间隔必须在1-168小时之间")

        self.check_interval_hours = hours
        self._save_settings()
        self._init_timer()  # 重新初始化定时器

    def check_for_updates(self, callback: Callable = None) -> ServiceResult:
        """检查更新"""
        try:
            if self.check_worker and self.check_worker.isRunning():
                return ServiceResult.error("更新检查正在进行中")

            # 记录检查时间
            from datetime import datetime
            self.last_check_time = datetime.now().isoformat()
            self._save_settings()

            self.check_worker = UpdateCheckWorker(self.update_server_url, self.current_version)

            if callback:
                self.check_worker.update_available.connect(lambda info: callback('update_available', info))
                self.check_worker.no_update.connect(lambda: callback('no_update', None))
                self.check_worker.error_occurred.connect(lambda error: callback('error', error))

            self.check_worker.start()
            
            return ServiceResult.success("开始检查更新")
            
        except Exception as e:
            self.logger.error(f"检查更新失败: {e}")
            return ServiceResult.error(f"检查更新失败: {str(e)}")
    
    def download_update(self, update_info: UpdateInfo, progress_callback: Callable = None) -> ServiceResult:
        """下载更新"""
        try:
            if self.download_worker and self.download_worker.isRunning():
                return ServiceResult.error("更新下载正在进行中")
            
            if not update_info.download_url:
                return ServiceResult.error("下载链接无效")
            
            self.download_worker = UpdateDownloadWorker(
                update_info.download_url, 
                update_info.checksum
            )
            
            if progress_callback:
                self.download_worker.download_progress.connect(
                    lambda d, t, p: progress_callback('progress', d, t, p)
                )
                self.download_worker.download_completed.connect(
                    lambda path: progress_callback('completed', path)
                )
                self.download_worker.download_failed.connect(
                    lambda error: progress_callback('failed', error)
                )
            
            self.download_worker.start()
            
            return ServiceResult.success("开始下载更新")
            
        except Exception as e:
            self.logger.error(f"下载更新失败: {e}")
            return ServiceResult.error(f"下载更新失败: {str(e)}")
    
    def install_update(self, installer_path: str, force: bool = False) -> ServiceResult:
        """安装更新"""
        try:
            if not os.path.exists(installer_path):
                return ServiceResult.error("安装文件不存在")
            
            # 验证文件是否为可执行文件
            if not installer_path.lower().endswith(('.exe', '.msi')):
                return ServiceResult.error("无效的安装文件格式")
            
            # 启动安装程序
            if force:
                # 强制更新模式：静默安装
                subprocess.Popen([installer_path, '/S', '/FORCE'], 
                               creationflags=subprocess.CREATE_NO_WINDOW)
            else:
                # 正常更新模式：显示安装界面
                subprocess.Popen([installer_path])
            
            return ServiceResult.success("更新安装已启动")
            
        except Exception as e:
            self.logger.error(f"安装更新失败: {e}")
            return ServiceResult.error(f"安装更新失败: {str(e)}")
    
    def get_current_version(self) -> str:
        """获取当前版本"""
        return self.current_version
    
    def set_auto_check_enabled(self, enabled: bool):
        """设置自动检查更新"""
        self.auto_check_enabled = enabled
        # 保存到配置文件
    
    def set_update_server_url(self, url: str):
        """设置更新服务器地址"""
        self.update_server_url = url
        # 保存到配置文件
    
    def cancel_download(self):
        """取消下载"""
        if self.download_worker and self.download_worker.isRunning():
            self.download_worker.cancel()
            self.download_worker.wait()
    
    def cleanup_temp_files(self):
        """清理临时文件"""
        try:
            temp_dir = tempfile.gettempdir()
            for file in Path(temp_dir).glob("ai_prompt_studio_update_*"):
                try:
                    file.unlink()
                except:
                    pass
        except Exception as e:
            self.logger.warning(f"清理临时文件失败: {e}") 