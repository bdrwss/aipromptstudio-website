// AI Prompt Studio 更新检查API
// Vercel Serverless Function

export default function handler(req, res) {
  // 启用CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent');

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
    version: "1.2.1",
    build: 121,
    download_url: "https://github.com/bdrwss/aipromptstudio-website/releases/download/v1.2.1/AI_Prompt_Studio_v1.2.1_Setup.exe",
    file_size: 89421824, // 85.27MB
    checksum: "sha256:01a2657bf3e136bbc8c7bd8785fd70d37658ead842891cba378a8acb525c1777",
    release_notes: "🔧 AI Prompt Studio v1.2.1 紧急修复版\n\n🐛 重要修复:\n- 修复了37个ServiceResult.error()调用错误\n- 彻底解决了'bool object is not callable'问题\n- 提升了系统稳定性和错误处理\n- 改进了更新功能的可靠性\n\n✨ 改进:\n- 加强了异常处理和安全检查\n- 优化了错误处理逻辑\n- 提升了应用程序整体稳定性\n\n📦 发布版本:\n- 单文件便携版\n- Windows安装包版\n- 绿色解压版\n\n⚠️ 建议所有用户立即更新到此版本",
    force_update: true,  // 强制更新，修复重要问题
    min_version: "1.0.0", // 最低支持版本
    release_date: "2025-08-18T11:30:00Z",
    download_mirrors: [
      // 备用下载地址
      "https://github.com/microsoft/vscode/releases/download/1.85.0/VSCodeUserSetup-x64-1.85.0.exe"
    ],
    changes: [
      "修复了37个ServiceResult.error()调用错误",
      "解决了'bool object is not callable'问题",
      "提升了系统稳定性和错误处理",
      "改进了更新功能的可靠性",
      "加强了异常处理和安全检查",
      "优化了错误处理逻辑"
    ]
  };

  // 版本比较函数
  function compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }
    return 0;
  }

  // 检查版本
  const hasUpdate = compareVersions(current_version, LATEST_VERSION.version) < 0;
  const meetsMinVersion = compareVersions(current_version, LATEST_VERSION.min_version) >= 0;

  if (!meetsMinVersion) {
    // 版本过低，必须更新
    console.log(`⚠️ 版本过低: ${current_version} < ${LATEST_VERSION.min_version}`);
    return res.json({
      has_update: true,
      current_version: current_version,
      version: LATEST_VERSION.version,
      build: LATEST_VERSION.build,
      download_url: LATEST_VERSION.download_url,
      file_size: LATEST_VERSION.file_size,
      checksum: LATEST_VERSION.checksum,
      release_notes: LATEST_VERSION.release_notes,
      force_update: true, // 版本过低强制更新
      min_version: LATEST_VERSION.min_version,
      release_date: LATEST_VERSION.release_date,
      update_reason: "版本过低，必须更新",
      download_mirrors: LATEST_VERSION.download_mirrors,
      changes: LATEST_VERSION.changes
    });
  }

  if (hasUpdate) {
    // 有更新可用
    console.log(`🔄 发现更新: ${current_version} -> ${LATEST_VERSION.version}`);
    return res.json({
      has_update: true,
      current_version: current_version,
      version: LATEST_VERSION.version,
      build: LATEST_VERSION.build,
      download_url: LATEST_VERSION.download_url,
      file_size: LATEST_VERSION.file_size,
      checksum: LATEST_VERSION.checksum,
      release_notes: LATEST_VERSION.release_notes,
      force_update: LATEST_VERSION.force_update,
      min_version: LATEST_VERSION.min_version,
      release_date: LATEST_VERSION.release_date,
      update_reason: "版本更新",
      download_mirrors: LATEST_VERSION.download_mirrors,
      changes: LATEST_VERSION.changes
    });
  } else {
    // 无更新
    console.log(`✅ 当前已是最新版本: ${current_version}`);
    return res.json({
      has_update: false,
      current_version: current_version,
      latest_version: LATEST_VERSION.version,
      message: "当前已是最新版本",
      release_date: LATEST_VERSION.release_date
    });
  }
}
