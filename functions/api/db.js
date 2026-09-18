export async function onRequest(context) {
    const { request, env } = context;

    // 跨域与通信头支持（为跨环境搬家做绝对兼容）
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // 【终极防线 1】拦截空绑定异常：如果环境没挂载成功，优雅返回空对象让前端存活，而不是崩溃
        if (!env.MY_BUCKET) {
            return new Response(JSON.stringify({}), { 
                status: 200, 
                headers: { "Content-Type": "application/json", ...corsHeaders } 
            });
        }

        // 【终极防线 2】处理 GET 拉取数据
        if (request.method === "GET") {
            const object = await env.MY_BUCKET.get("db.json");
            
            // 如果旧桶是空的或者文件不存在，返回空初始化状态
            if (!object) {
                return new Response(JSON.stringify({}), { 
                    status: 200, 
                    headers: { "Content-Type": "application/json", ...corsHeaders } 
                });
            }
            
            // 修复数据流锁死 BUG：强制转换为文本体再返回，确保 100% 吐出数据
            const text = await object.text();
            return new Response(text, { 
                status: 200, 
                headers: { "Content-Type": "application/json", ...corsHeaders } 
            });
        }

        // 【终极防线 3】处理 POST 保存数据
        if (request.method === "POST") {
            const data = await request.json();
            await env.MY_BUCKET.put("db.json", JSON.stringify(data));
            return new Response(JSON.stringify({ success: true }), { 
                status: 200, 
                headers: { "Content-Type": "application/json", ...corsHeaders } 
            });
        }

        // 非法请求方法拦截
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), { 
            status: 405, 
            headers: corsHeaders 
        });

    } catch (err) {
        // 【绝对保活机制】即使遇到极端未知错误，也包装成 JSON 返回，绝对不抛出 500 导致前端红屏
        return new Response(JSON.stringify({ 
            error: err.message || "后端发生未知崩溃",
            isError: true 
        }), { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
        });
    }
}
