export async function onRequest(context) {
    const { request, env, params } = context;
    const path = params.path.join('/');

    // 1. 跨域与白名单安全配置，允许任何环境调用播放
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Range", // 必须放行 Range 请求头
        "Access-Control-Expose-Headers": "Accept-Ranges, Content-Range, Content-Length" // 必须暴露给浏览器
    };

    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        if (!env.MY_BUCKET) {
            return new Response("R2 存储桶未挂载", { status: 500, headers: corsHeaders });
        }

        // 2. 核心流媒体增强：解析并透传苹果 Safari 的 Range 分片请求
        const rangeHeader = request.headers.get("Range");
        const getOptions = {};
        if (rangeHeader) {
            // 将前端的范围请求原封不动地传给底层的 R2 引擎
            getOptions.range = request.headers; 
        }

        // 去 R2 提取实体文件
        const object = await env.MY_BUCKET.get(path, getOptions);

        // 防御：文件彻底丢失时的优雅处理
        if (object === null) {
            return new Response("文件不存在", { status: 404, headers: corsHeaders });
        }

        // 3. 组装工业级响应头
        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        
        // 告诉苹果 Safari：我支持流媒体精准断点续传（解决时长错乱与报错核心）
        headers.set("Accept-Ranges", "bytes");

        // 4. 极致缓存优化：让浏览器把这首歌缓存一年，实现物理秒开，暴砍 Cloudflare 计费
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        // 5. 动态状态码：如果是切片请求则返回 206 局部内容，否则返回 200 完整内容
        const status = object.range ? 206 : 200;

        return new Response(object.body, { 
            status, 
            headers 
        });

    } catch (error) {
        // 未知致命错误兜底，绝不让浏览器端出现红屏 500
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
        });
    }
}
