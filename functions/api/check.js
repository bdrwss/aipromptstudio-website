export default function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // 获取请求参数
  const { 
    current_version = '1.0.0', 
    platform = 'windows', 
    arch = 'x64',
    user_id = 'anonymous'
  } = req.query;

  // 记录请求日志
  console.log(`📋 更新检查请求: 版本=${current_version}, 平台=${platform}, 架构=${arch}, 用户=${user_id}`);

  // 版本配置 - 在这里配置最新版本信息
  const LATEST_VERSION = {
    version: "1.2.2",
    download_url: "https://github.com/bdrwss/AI-Prompt-Studio-No.1/releases/download/v1.2.2/AI_Prompt_Studio_v1.2.2_Setup.exe",
    file_size: 84802376, // 80.9MB，实际文件大小
    checksum: "sha256:031bbb6832f96b0a4bb8b688c2adc3c7a9400a86830407756226664f82b44189", // 实际文件的SHA256
    release_notes: "🚀 AI Prompt Studio v1.2.2\n\n✨ 新功能:\n- 强制自动更新功能\n- 优化用户界面\n- 提升性能和稳定性\n\n🐛 修复:\n- 修复若干已知问题\n- 提升系统稳定性\n- 优化内存使用",
    force_update: true,  // 强制更新
    min_version: "1.0.0", // 最低支持版本
    release_date: "2025-08-23T03:33:55Z",
    download_mirrors: [
      // 备用下载地址（可选）
      "https://github.com/bdrwss/AI-Prompt-Studio-No.1/releases/download/v1.2.2/AI_Prompt_Studio_v1.2.2_Setup.exe"
    ]
  };

  // 版本比较函数
  function compareVersions(version1, version2) {
    try {
      const v1parts = version1.split('.').map(Number);
      const v2parts = version2.split('.').map(Number);
      
      // 补齐版本号长度
      const maxLength = Math.max(v1parts.length, v2parts.length);
      while (v1parts.length < maxLength) v1parts.push(0);
      while (v2parts.length < maxLength) v2parts.push(0);
      
      for (let i = 0; i < maxLength; i++) {
        if (v1parts[i] < v2parts[i]) return -1;
        if (v1parts[i] > v2parts[i]) return 1;
      }
      return 0;
    } catch (error) {
      console.error('版本比较错误:', error);
      return -1; // 出错时默认有更新
    }
  }

  try {
    const hasUpdate = compareVersions(current_version, LATEST_VERSION.version) < 0;

    if (hasUpdate || LATEST_VERSION.force_update) {
      console.log(`🔄 发现更新: ${current_version} -> ${LATEST_VERSION.version}`);
      res.status(200).json({
        has_update: true,
        version: LATEST_VERSION.version,
        download_url: LATEST_VERSION.download_url,
        file_size: LATEST_VERSION.file_size,
        checksum: LATEST_VERSION.checksum,
        release_notes: LATEST_VERSION.release_notes,
        force_update: LATEST_VERSION.force_update,
        min_version: LATEST_VERSION.min_version,
        release_date: LATEST_VERSION.release_date,
        download_mirrors: LATEST_VERSION.download_mirrors,
        platform: platform,
        arch: arch
      });
    } else {
      console.log(`✅ 版本最新: ${current_version}`);
      res.status(200).json({
        has_update: false,
        current_version: current_version,
        latest_version: LATEST_VERSION.version,
        message: "当前已是最新版本",
        platform: platform,
        arch: arch
      });
    }
  } catch (error) {
    console.error('处理更新检查时出错:', error);
    res.status(500).json({
      error: "服务器内部错误",
      message: "无法检查更新，请稍后重试"
    });
  }
}
