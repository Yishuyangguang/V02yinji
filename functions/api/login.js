export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { username, password } = body;

        // 与 Cloudflare 后台设置的加密环境变量进行严格比对
        if (username === env.ADMIN_USER && password === env.ADMIN_PASS) {
            const token = "admin_authorized_secure_token_" + Date.now(); 
            return new Response(JSON.stringify({ success: true, message: "管理员鉴权成功" }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Set-Cookie": `admin_session=${token}; HttpOnly; Secure; Path=/; Max-Age=86400`
                }
            });
        }
        return new Response(JSON.stringify({ success: false, message: "非管理员账号" }), {
            status: 401, headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: "请求格式错误" }), {
            status: 400, headers: { "Content-Type": "application/json" }
        });
    }
}
