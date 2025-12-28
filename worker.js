export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/") return await handleHome(env);
    if (path === "/admin") return await handleAdminPage();
    if (path === "/api/config" && request.method === "GET") return await getConfig(env);
    if (path === "/api/config" && request.method === "POST") return await updateConfig(request, env);
    if (path === "/api/login" && request.method === "POST") return await handleLogin(request, env);

    return new Response("Not Found", { status: 404 });
  }
};

async function getConfigData(env) {
  const defaultData = {
    siteTitle: "大鸡巴视频播放器",
    heroTitle: "超清流畅体验",
    heroDesc: "支持全平台播放\n智能编解码技术\n极速秒开不卡顿",
    logoUrl: "https://www.cloudflare.com/img/logo-cloudflare-dark.svg",
    bgUrl: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0",
    videoPoster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    downloadLink: "#"
  };
  const kvData = await env.IMAGE_CONFIG_KV.get("config");
  return kvData ? JSON.parse(kvData) : defaultData;
}

/**
 * 首页展示 - 下载按钮已改为蓝色
 */
async function handleHome(env) {
  const config = await getConfigData(env);
  return new Response(`
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.siteTitle}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { 
        background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${config.bgUrl}') center/cover fixed no-repeat; 
      }
      .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.1); }
      .preserve-breaks { white-space: pre-line; }
      /* 按钮平滑过渡 */
      .btn-transition { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    </style>
  </head>
  <body class="min-h-screen flex items-center justify-center p-4 md:p-8 text-white antialiased">
    <div class="glass max-w-6xl w-full rounded-3xl p-6 md:p-12 shadow-2xl overflow-hidden">
      <div class="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
        <img src="${config.logoUrl}" class="h-8 object-contain">
        <h1 class="text-xl font-medium tracking-wider opacity-80">${config.siteTitle}</h1>
      </div>
      
      <div class="grid lg:grid-cols-5 gap-12 items-center">
        <div class="lg:col-span-3 rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 aspect-video">
          <video id="player" controls poster="${config.videoPoster}" class="w-full h-full object-contain">
            <source src="${config.videoUrl}" type="video/mp4">
          </video>
        </div>
        
        <div class="lg:col-span-2 text-left">
          <h2 class="text-4xl md:text-5xl font-black mb-6 leading-tight">${config.heroTitle}</h2>
          <p class="text-gray-300 mb-10 text-lg leading-relaxed preserve-breaks opacity-90">${config.heroDesc}</p>
          
          <a href="${config.downloadLink}" class="btn-transition inline-block w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-center shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transform hover:-translate-y-1 active:scale-95">
            立即下载客户端
          </a>
          
          <div class="mt-6 flex items-center gap-4 opacity-40">
            <span class="text-[10px] uppercase tracking-widest">Version 2.4.0</span>
            <div class="h-px flex-1 bg-white/20"></div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>`, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
}

/**
 * 后台管理
 */
async function handleAdminPage() {
  return new Response(`
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script></head>
  <body class="bg-[#0f172a] text-slate-200 p-6 md:p-10">
    <div class="max-w-3xl mx-auto">
      <div id="loginSection" class="bg-slate-800/50 p-8 rounded-3xl border border-white/10 text-center shadow-2xl">
        <h2 class="text-2xl font-bold mb-6">管理验证</h2>
        <input type="password" id="pw" placeholder="Secret Key" class="w-full p-4 bg-slate-900 rounded-xl mb-4 outline-none border border-slate-700">
        <button onclick="login()" class="w-full bg-blue-600 py-4 rounded-xl font-bold">验证</button>
      </div>
      
      <div id="adminSection" class="hidden bg-slate-800/50 p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl">
        <h2 class="text-xl font-bold border-b border-white/10 pb-4 text-blue-400">控制面板</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="text-xs text-slate-400 font-bold uppercase">网站标题</label><input id="siteTitle" class="w-full p-2 bg-slate-900 rounded border border-slate-700"></div>
            <div><label class="text-xs text-slate-400 font-bold uppercase">主标题</label><input id="heroTitle" class="w-full p-2 bg-slate-900 rounded border border-slate-700"></div>
        </div>
        
        <div><label class="text-xs text-slate-400 font-bold uppercase">描述文案 (回车换行)</label><textarea id="heroDesc" class="w-full p-2 bg-slate-900 rounded border border-slate-700 h-24"></textarea></div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="text-xs text-blue-400 font-bold">背景图 URL</label><input id="bgUrl" class="w-full p-2 bg-slate-900 rounded border border-blue-900/50"></div>
            <div><label class="text-xs text-blue-400 font-bold">视频封面 URL</label><input id="videoPoster" class="w-full p-2 bg-slate-900 rounded border border-blue-900/50"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="text-xs text-slate-400 font-bold uppercase">Logo URL</label><input id="logoUrl" class="w-full p-2 bg-slate-900 rounded border border-slate-700"></div>
            <div><label class="text-xs text-orange-400 font-bold uppercase">视频外链</label><input id="videoUrl" class="w-full p-2 bg-slate-900 rounded border border-orange-900/50"></div>
        </div>

        <div><label class="text-xs text-purple-400 font-bold uppercase">下载链接</label><input id="downloadLink" class="w-full p-2 bg-slate-900 rounded border border-purple-900/50"></div>
        
        <button onclick="save()" class="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg">更新内容</button>
      </div>
    </div>
    <script>
      let token = "";
      async function login() {
        const pw = document.getElementById('pw').value;
        const res = await fetch('/api/login', { method: 'POST', body: JSON.stringify({ password: pw }) });
        if(res.ok) { 
          token = pw; 
          document.getElementById('loginSection').remove(); 
          document.getElementById('adminSection').classList.remove('hidden');
          const data = await (await fetch('/api/config')).json();
          ['siteTitle','heroTitle','heroDesc','logoUrl','bgUrl','videoPoster','videoUrl','downloadLink'].forEach(k => {
              if(document.getElementById(k)) document.getElementById(k).value = data[k] || "";
          });
        } else alert('密码错误');
      }
      async function save() {
        const config = {};
        ['siteTitle','heroTitle','heroDesc','logoUrl','bgUrl','videoPoster','videoUrl','downloadLink'].forEach(k => {
            config[k] = document.getElementById(k).value;
        });
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Authorization': token },
          body: JSON.stringify(config)
        });
        if(res.ok) alert('✅ 官网内容已刷新');
      }
    </script>
  </body>
  </html>`, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
}

/**
 * 核心 API 逻辑
 */
async function handleLogin(request, env) {
  const { password } = await request.json();
  return password === env.adminPassword ? new Response("OK") : new Response("Error", { status: 401 });
}
async function getConfig(env) {
  return new Response(JSON.stringify(await getConfigData(env)));
}
async function updateConfig(request, env) {
  if (request.headers.get("Authorization") !== env.adminPassword) return new Response("UA", { status: 401 });
  await env.IMAGE_CONFIG_KV.put("config", JSON.stringify(await request.json()));
  return new Response("OK");
}