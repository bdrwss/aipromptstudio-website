// AI Prompt Studio 更新检查API
// Vercel Serverless Function

export default function handler(req, res) {
  // 启用CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: '只支持GET请求'
    });
  }

  // 获取请求参数
  const { 
    current_version, 
    platform = 'windows', 
    arch = 'x64',
    user_id = 'anonymous'
  } = req.query;

  // 验证必需参数
  if (!current_version) {
    return res.status(400).json({
      error: "缺少 current_version 参数",
      message: "请提供当前版本号"
    });
  }

  // 记录请求日志
  console.log(`📋 更新检查请求: 版本=${current_version}, 平台=${platform}, 架构=${arch}, 用户=${user_id}`);

  // 版本配置 - 在这里配置最新版本信息
  const LATEST_VERSION = {
    version: "1.2.0",
    download_url: "https://github.com/bdrwss/AI-Prompt-Studio-No.1/releases/download/v1.2.0/AI_Prompt_Studio_v1.2.0_Setup.exe",
    file_size: 89416926, // 89.4MB，根据实际文件大小修改
    checksum: "sha256:01A2657BF3E136BBC8C7BD8785FD70D37658EAD842891CBA378A8ACB525C1777", // 实际文件的SHA256
    release_notes: "🚀 AI Prompt Studio v1.2.0\n\n✨ 新功能:\n- 新增功能和改进\n- 优化用户界面\n- 提升性能和稳定性\n\n🐛 修复:\n- 修复若干已知问题\n- 提升系统稳定性\n- 优化更新机制",
    force_update: true,  // 强制更新
    min_version: "1.0.0", // 最低支持版本
    release_date: "2025-01-18T10:00:00Z",
    download_mirrors: [
      // 备用下载地址（可选）
      "https://github.com/bdrwss/AI-Prompt-Studio-No.1/releases/download/v1.2.0/AI_Prompt_Studio_v1.2.0_Setup.exe"
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
        const v1part = v1parts[i] || 0;
        const v2part = v2parts[i] || 0;
        
        if (v1part < v2part) return -1;
        if (v1part > v2part) return 1;
      }
      return 0;
    } catch (error) {
      console.error('版本比较错误:', error);
      return 0;
    }
  }

  // 检查是否需要更新
  const hasUpdate = compareVersions(current_version, LATEST_VERSION.version) < 0;
  const isForceUpdate = LATEST_VERSION.force_update;

  // 检查最低版本要求
  const meetsMinVersion = compareVersions(current_version, LATEST_VERSION.min_version) >= 0;

  if (!meetsMinVersion) {
    // 版本过低，必须更新
    console.log(`⚠️ 版本过低: ${current_version} < ${LATEST_VERSION.min_version}`);
    return res.json({
      has_update: true,
      version: LATEST_VERSION.version,
      download_url: LATEST_VERSION.download_url,
      file_size: LATEST_VERSION.file_size,
      checksum: LATEST_VERSION.checksum,
      release_notes: LATEST_VERSION.release_notes,
      force_update: true, // 版本过低强制更新
      min_version: LATEST_VERSION.min_version,
      release_date: LATEST_VERSION.release_date,
      update_reason: "版本过低，必须更新",
      download_mirrors: LATEST_VERSION.download_mirrors
    });
  }

  if (hasUpdate || isForceUpdate) {
    // 有更新可用
    console.log(`🔄 发现更新: ${current_version} -> ${LATEST_VERSION.version}`);
    return res.json({
      has_update: true,
      version: LATEST_VERSION.version,
      download_url: LATEST_VERSION.download_url,
      file_size: LATEST_VERSION.file_size,
      checksum: LATEST_VERSION.checksum,
      release_notes: LATEST_VERSION.release_notes,
      force_update: isForceUpdate,
      min_version: LATEST_VERSION.min_version,
      release_date: LATEST_VERSION.release_date,
      update_reason: isForceUpdate ? "强制更新" : "版本更新",
      download_mirrors: LATEST_VERSION.download_mirrors
    });
  } else {
    // 已是最新版本
    console.log(`✅ 版本最新: ${current_version}`);
    return res.json({
      has_update: false,
      current_version: current_version,
      latest_version: LATEST_VERSION.version,
      message: "当前已是最新版本",
      check_time: new Date().toISOString()
    });
  }
}
