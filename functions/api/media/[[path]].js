export async function onRequest(context) {
    const { request, env, params } = context;
    const path = params.path.join('/');

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Range", 
        "Access-Control-Expose-Headers": "Accept-Ranges, Content-Range, Content-Length"
    };

    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
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
        headers.set("Accept-Ranges", "bytes");

        const status = object.range ? 206 : 200;

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
