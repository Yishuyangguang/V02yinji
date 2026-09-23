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

        // 绝对真理：云端标准时间戳，彻底粉碎修改手机本地时间白嫖的漏洞
        const now = Date.now();

        // 【行动 1】：静默心跳与防封禁检测
        if (action === "check_status") {
            // 站长无上特权，永久绿灯
            if (username === "yishuyangguang") {
                return new Response(JSON.stringify({ success: true, status: "normal", expireAt: 4102444800000, now }), { headers: corsHeaders });
            }
            
            const user = db.users[username];
            if (!user) return new Response(JSON.stringify({ error: "用户不存在" }), { status: 400, headers: corsHeaders });
            if (user.status === "banned") return new Response(JSON.stringify({ error: "您的账号已被管理员限制使用，请联系站长", status: "banned" }), { status: 403, headers: corsHeaders });
            if (user.expireAt && now > user.expireAt) return new Response(JSON.stringify({ error: "印记时空已到期，请进入个人中心续费", status: "expired" }), { status: 403, headers: corsHeaders });
            
            return new Response(JSON.stringify({ success: true, status: "normal", expireAt: user.expireAt || 0, now }), { headers: corsHeaders });
        }

        // 【安全拦截】：进入注册或续费，必须带卡密
        if (!key) return new Response(JSON.stringify({ error: "缺少授权卡密" }), { status: 400, headers: corsHeaders });
        const license = db.licenseKeys[key];
        if (!license) return new Response(JSON.stringify({ error: "无效的卡密" }), { status: 400, headers: corsHeaders });
        if (license.isUsed) return new Response(JSON.stringify({ error: "该卡密已被使用过" }), { status: 400, headers: corsHeaders });

        let targetExpireAt = now;

        // 【行动 2】：新用户核销注册
        if (action === "register") {
            if (db.users[username]) return new Response(JSON.stringify({ error: "账号已存在，请直接登录" }), { status: 400, headers: corsHeaders });
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
        // 【行动 3】：老用户累加续费
        else if (action === "renew") {
            const user = db.users[username];
            if (!user) return new Response(JSON.stringify({ error: "用户不存在" }), { status: 400, headers: corsHeaders });
            
            // 核心累加算法：没过期就在原有基础上加，过期了就从此刻开始算
            const baseTime = (user.expireAt && user.expireAt > now) ? user.expireAt : now;
            targetExpireAt = baseTime + license.days * 24 * 60 * 60 * 1000;
            
            user.expireAt = targetExpireAt;
            user.status = "normal"; // 充值后自动解除可能存在的过期封禁
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
