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
    version: "1.2.0",
    build: 120,
    download_url: "https://github.com/bdrwss/aipromptstudio/releases/download/v1.2.0/AI_Prompt_Studio.exe",
    file_size: 127355492, // 121.5MB
    checksum: "sha256:71261EDF50AE29F757A34544B7B56F64D7F4EFE7EAFB1AD75392C5BCCC78834C",
    release_notes: "🚀 AI Prompt Studio v1.2.0 正式发布\n\n✨ 新功能:\n- 版本号统一更新至1.2.0\n- 完善的自动更新系统\n- 优化的打包和发布流程\n- 改进的用户界面体验\n\n🐛 修复:\n- 修复版本显示不一致问题\n- 优化更新检测机制\n- 提升应用程序稳定性\n- 改进错误处理逻辑\n\n📦 发布版本:\n- 单文件便携版\n- Windows安装包版\n- 绿色解压版",
    force_update: false,  // 非强制更新，便于测试
    min_version: "1.0.0", // 最低支持版本
    release_date: "2025-08-17T10:00:00Z",
    download_mirrors: [
      // 备用下载地址
      "https://github.com/microsoft/vscode/releases/download/1.85.0/VSCodeUserSetup-x64-1.85.0.exe"
    ],
    changes: [
      "完善的按钮连接修复",
      "强制更新对话框保持显示",
      "版本显示逻辑优化",
      "下载重试功能完善",
      "修复重试下载按钮问题",
      "提升更新流程稳定性"
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
