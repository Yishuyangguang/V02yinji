export async function onRequest(context) {
    const { request, env } = context;

    // 🛡️ 新增最高级别的防缓存指令，确保注册后前端拉取的一定是绝对最新数据
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-admin-auth",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    };

    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        if (!env.MY_BUCKET) {
            return new Response(JSON.stringify({}), { 
                status: 200, 
                headers: { "Content-Type": "application/json", ...corsHeaders } 
            });
        }

        const isAdmin = request.headers.get("x-admin-auth") === "yishuyangguang";

        if (request.method === "GET") {
            const object = await env.MY_BUCKET.get("db.json");
            if (!object) {
                return new Response(JSON.stringify({}), { 
                    status: 200, 
                    headers: { "Content-Type": "application/json", ...corsHeaders } 
                });
            }
            
            let dbData = await object.json();
            
            if (!isAdmin && dbData.licenseKeys) {
                delete dbData.licenseKeys;
            }
            
            return new Response(JSON.stringify(dbData), { 
                status: 200, 
                headers: { "Content-Type": "application/json", ...corsHeaders } 
            });
        }

        if (request.method === "POST") {
            const incomingData = await request.json();
            
            const object = await env.MY_BUCKET.get("db.json");
            if (object) {
                const cloudDb = await object.json();
                
                if (!isAdmin) {
                    if (cloudDb.stages) {
                        incomingData.stages = cloudDb.stages;
                    }
                    if (cloudDb.globalMusicConfig) {
                        incomingData.globalMusicConfig = cloudDb.globalMusicConfig;
                    }
                    if (cloudDb.licenseKeys) {
                        incomingData.licenseKeys = cloudDb.licenseKeys;
                    }
                    if (cloudDb.users && incomingData.users) {
                        for (let u in incomingData.users) {
                            if (cloudDb.users[u]) {
                                incomingData.users[u].expireAt = cloudDb.users[u].expireAt;
                                incomingData.users[u].status = cloudDb.users[u].status;
                            } else {
                                incomingData.users[u].expireAt = 0;
                                incomingData.users[u].status = "banned";
                            }
                        }
                    }
                }
            }

            await env.MY_BUCKET.put("db.json", JSON.stringify(incomingData));
            return new Response(JSON.stringify({ success: true }), { 
                status: 200, 
                headers: { "Content-Type": "application/json", ...corsHeaders } 
            });
        }

        return new Response(JSON.stringify({ error: "Method Not Allowed" }), { 
            status: 405, 
            headers: corsHeaders 
        });

    } catch (err) {
        return new Response(JSON.stringify({ 
            error: err.message || "后端发生未知崩溃",
            isError: true 
        }), { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
        });
    }
}
