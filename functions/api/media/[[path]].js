export async function onRequest(context) {
    const { request, env, params } = context;
    const path = params.path.join('/');

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS, DELETE", 
        "Access-Control-Allow-Headers": "Content-Type, Range", 
        "Access-Control-Expose-Headers": "Accept-Ranges, Content-Range, Content-Length"
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method === "DELETE") {
        try { await env.MY_BUCKET.delete(path); return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders }); } 
        catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders }); }
    }

    try {
        if (!env.MY_BUCKET) return new Response("R2 Not Found", { status: 500, headers: corsHeaders });

        // 1. 获取文件总大小，这是手机端边下边播的刚需
        const headObj = await env.MY_BUCKET.head(path);
        if (!headObj) return new Response("Not Found", { status: 404, headers: corsHeaders });

        const fileSize = headObj.size;
        const rangeHeader = request.headers.get("Range");

        let object;
        let status = 200;
        const headers = new Headers(corsHeaders);
        headers.set("Accept-Ranges", "bytes");
        headers.set("etag", headObj.httpEtag);
        // 让浏览器缓存 1 年，二次播放直接免流量秒开
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("Content-Type", headObj.httpMetadata?.contentType || "audio/mpeg");

        // 2. 核心：精准拦截手机端的字节流请求 (206 断点续传协议)
        if (rangeHeader) {
            const matches = rangeHeader.match(/bytes=(\d+)-(\d*)/);
            if (matches) {
                const start = parseInt(matches[1], 10);
                let end = matches[2] ? parseInt(matches[2], 10) : fileSize - 1;
                
                if (end >= fileSize) end = fileSize - 1;
                const length = end - start + 1;

                object = await env.MY_BUCKET.get(path, { range: { offset: start, length: length } });
                status = 206; // HTTP 206 Partial Content (边下边播的灵魂)
                headers.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
                headers.set("Content-Length", length.toString());
            } else {
                object = await env.MY_BUCKET.get(path);
                headers.set("Content-Length", fileSize.toString());
            }
        } else {
            object = await env.MY_BUCKET.get(path);
            headers.set("Content-Length", fileSize.toString());
        }

        return new Response(object.body, { status, headers });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}
