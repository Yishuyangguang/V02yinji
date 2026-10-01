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
        const now = Date.now();
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

        // 惰性清理函数：读取或写入前净化数据库
        const purifyDB = (database) => {
            let changed = false;
            if (database.users) {
                for (let u in database.users) {
                    if (database.users[u].expireAt && database.users[u].expireAt > 0) {
                        if (now - database.users[u].expireAt > ONE_YEAR_MS) {
                            delete database.users[u];
                            changed = true;
                        }
                    }
                }
            }
            return changed;
        };

        if (request.method === "GET") {
            const object = await env.MY_BUCKET.get("db.json");
            if (!object) {
                return new Response(JSON.stringify({}), { 
                    status: 200, 
                    headers: { "Content-Type": "application/json", ...corsHeaders } 
                });
            }
            
            let dbData = await object.json();
            const needsSave = purifyDB(dbData);
            
            // 如果 GET 操作触发了清理，静默存盘一次
            if (needsSave) {
                await env.MY_BUCKET.put("db.json", JSON.stringify(dbData));
            }
            
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
            purifyDB(incomingData); // 写入前先净化一下
            
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
