export async function onRequest(context) {
    const { request, env } = context;

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-admin-auth"
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
            
            // 【终极防线 1】非站长拉取数据时，物理切除卡密库，杜绝 F12 抓包泄露
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
            
            // 【终极防线 2】读取云端真实数据进行缝合，防止核心字段被前端篡改或覆盖
            const object = await env.MY_BUCKET.get("db.json");
            if (object) {
                const cloudDb = await object.json();
                
                if (!isAdmin) {
                    // 🛡️ 钛合金只读锁：强制保护站长配置的阶段卡片和音乐库！普通用户绝对无法覆盖
                    if (cloudDb.stages) {
                        incomingData.stages = cloudDb.stages;
                    }
                    if (cloudDb.globalMusicConfig) {
                        incomingData.globalMusicConfig = cloudDb.globalMusicConfig;
                    }

                    // 保障 1：把刚才切除的卡密库缝合回去，防止被普通用户的上传清空
                    if (cloudDb.licenseKeys) {
                        incomingData.licenseKeys = cloudDb.licenseKeys;
                    }
                    
                    // 保障 2：权限锁死！强制使用云端的到期时间和封禁状态
                    if (cloudDb.users && incomingData.users) {
                        for (let u in incomingData.users) {
                            if (cloudDb.users[u]) {
                                // 正常老用户，继承云端权限
                                incomingData.users[u].expireAt = cloudDb.users[u].expireAt;
                                incomingData.users[u].status = cloudDb.users[u].status;
                            } else {
                                // 【打入冷宫】未经过 verifyKey 接口，妄图通过前端造假直接上传注册的用户，直接封禁
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
