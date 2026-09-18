export async function onRequest(context) {
    const { request, env, params } = context;
    const path = params.path.join('/');

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, DELETE", 
        "Access-Control-Allow-Headers": "Content-Type, Range", 
        "Access-Control-Expose-Headers": "Accept-Ranges, Content-Range, Content-Length"
    };

    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "DELETE") {
        try {
            await env.MY_BUCKET.delete(path);
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
        }
    }

    try {
        if (!env.MY_BUCKET) {
            return new Response("R2 存储桶未挂载", { status: 500, headers: corsHeaders });
        }

        const rangeHeader = request.headers.get("Range");
        const getOptions = {};
        if (rangeHeader) {
            getOptions.range = request.headers; 
        }

        const object = await env.MY_BUCKET.get(path, getOptions);

        if (object === null) {
            return new Response("文件不存在", { status: 404, headers: corsHeaders });
        }

        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        
        // 核心修复点：告诉浏览器支持断点续传
        headers.set("Accept-Ranges", "bytes");

        let status = 200;
        
        // 【致命错误修复点】：补齐 HTTP 206 协议强制要求的切片范围与长度响应头！
        if (object.range) {
            status = 206;
            // 必须告诉浏览器：当前发给你的是从哪到哪的字节，以及总文件有多大
            headers.set("Content-Range", `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`);
            headers.set("Content-Length", object.range.length.toString());
        } else {
            headers.set("Content-Length", object.size.toString());
        }

        // 让浏览器缓存音频文件一年，实现物理秒开
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        return new Response(object.body, { 
            status, 
            headers 
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
        });
    }
}
