export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { username, password } = body;

        // 与 Cloudflare 后台设置的环境变量进行严格比对

        if (username === env.ADMIN_USER && password === env.ADMIN_PASS) {
            
            // 签发管理员 Token，并设置 HttpOnly Cookie 防止 XSS 攻击
            const token = "admin_authorized_secure_token_" + Date.now(); 
            
            return new Response(JSON.stringify({ success: true, message: "管理员鉴权成功" }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Set-Cookie": `admin_session=${token}; HttpOnly; Secure; Path=/; Max-Age=86400`
                }
            });
        }

        // 账号或密码不匹配
        return new Response(JSON.stringify({ success: false, message: "非管理员账号" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        // 防御性编程：捕获恶意请求或非 JSON 格式请求
        return new Response(JSON.stringify({ success: false, message: "请求格式错误" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }
}
