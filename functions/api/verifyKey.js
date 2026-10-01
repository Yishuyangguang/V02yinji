export async function onRequest(context) {
    const { request, env } = context;
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const body = await request.json();
        const { action, username, password, key } = body;
        
        if (!env.MY_BUCKET) return new Response(JSON.stringify({ error: "服务器环境异常" }), { status: 500, headers: corsHeaders });

        const object = await env.MY_BUCKET.get("db.json");
        let db = object ? await object.json() : {};
        if (!db.licenseKeys) db.licenseKeys = {};
        if (!db.users) db.users = {};

        // 绝对真理：云端标准时间戳
        const now = Date.now();
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000; // 365天的毫秒数
        let dbChangedByCleanup = false;

        // 🚀 核心逻辑 1：惰性清理引擎 (Lazy Deletion)
        // 每次触发鉴权前，瞬间巡检全库，超过 1 年未续费的账号直接物理销毁，释放用户名
        for (let u in db.users) {
            if (db.users[u].expireAt && db.users[u].expireAt > 0) {
                if (now - db.users[u].expireAt > ONE_YEAR_MS) {
                    delete db.users[u];
                    dbChangedByCleanup = true;
                }
            }
        }

        // 【行动 1】：静默心跳与防封禁检测
        if (action === "check_status") {
            if (dbChangedByCleanup) await env.MY_BUCKET.put("db.json", JSON.stringify(db)); // 顺手存盘

            if (username === "yishuyangguang") {
                return new Response(JSON.stringify({ success: true, status: "normal", expireAt: 4102444800000, now }), { headers: corsHeaders });
            }
            
            const user = db.users[username];
            if (!user) return new Response(JSON.stringify({ error: "用户不存在或已被系统销毁" }), { status: 400, headers: corsHeaders });
            
            if (user.status === "banned") {
                return new Response(JSON.stringify({ error: "您的账号已被管理员限制使用，请联系站长", status: "banned" }), { status: 403, headers: corsHeaders });
            }
            
            if (!user.expireAt || now > user.expireAt) {
                return new Response(JSON.stringify({ error: "印记时空已到期。账号已进入1年保留期，请在登录界面输入新卡密直接登录以完成激活。", status: "expired" }), { status: 403, headers: corsHeaders });
            }
            
            return new Response(JSON.stringify({ success: true, status: "normal", expireAt: user.expireAt, now }), { headers: corsHeaders });
        }

        // 【安全拦截】：进入注册或续费，必须带卡密
        if (!key) return new Response(JSON.stringify({ error: "缺少授权卡密" }), { status: 400, headers: corsHeaders });
        const license = db.licenseKeys[key];
        if (!license) return new Response(JSON.stringify({ error: "无效的卡密" }), { status: 400, headers: corsHeaders });
        if (license.isUsed) return new Response(JSON.stringify({ error: "该卡密已被使用过" }), { status: 400, headers: corsHeaders });

        let targetExpireAt = now;

        // 【行动 2】：新用户核销注册 (或超期销毁后的重新注册)
        if (action === "register") {
            // 🚀 核心逻辑 2：状态拦截
            if (db.users[username]) {
                return new Response(JSON.stringify({ error: "账号已存在。若您的账号已过期但在1年保留期内，请勿重新注册，请直接【登录】并附带新卡密即可恢复数据。" }), { status: 400, headers: corsHeaders });
            }
            
            targetExpireAt = now + license.days * 24 * 60 * 60 * 1000;
            
            db.users[username] = {
                password: password,
                nickname: "",
                avatar: "",
                favorites: [],
                expireAt: targetExpireAt,
                status: "normal"
            };
        } 
        // 【行动 3】：老用户累加续费 (保留期内的拯救)
        else if (action === "renew") {
            const user = db.users[username];
            if (!user) return new Response(JSON.stringify({ error: "用户不存在或由于超过1年未续费已被永久销毁，请重新注册。" }), { status: 400, headers: corsHeaders });
            
            // 核心累加算法：没过期就在原有基础上加，过期了（保留期内）就从此刻重新开始算
            const baseTime = (user.expireAt && user.expireAt > now) ? user.expireAt : now;
            targetExpireAt = baseTime + license.days * 24 * 60 * 60 * 1000;
            
            user.expireAt = targetExpireAt;
            user.status = "normal"; // 充值后自动解除可能存在的过期封禁状态
        } else {
            return new Response(JSON.stringify({ error: "未知操作" }), { status: 400, headers: corsHeaders });
        }

        // 【防双花锁定】：物理核销卡密并打上烙印
        license.isUsed = true;
        license.usedBy = username;
        license.usedAt = now;

        await env.MY_BUCKET.put("db.json", JSON.stringify(db));

        return new Response(JSON.stringify({ 
            success: true, 
            expireAt: targetExpireAt, 
            days: license.days,
            now: now
        }), { 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
}
