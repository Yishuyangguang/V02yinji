// 文件路径： functions/api/db.js
export async function onRequest(context) {
    const { request, env } = context;
    // 绑定您在 CF 后台创建的 R2 桶，变量名为 MY_BUCKET
    const bucket = env.MY_BUCKET; 

    // 如果未绑定 R2，返回错误提示
    if (!bucket) {
        return new Response(JSON.stringify({ error: "R2 Bucket 未绑定" }), { status: 500 });
    }

    try {
        // [GET] 获取全站数据
        if (request.method === 'GET') {
            const object = await bucket.get('sealOfLove_FullData.json');
            if (object === null) {
                return new Response(JSON.stringify({}), { 
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
            return new Response(object.body, { 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // [POST] 保存全站数据（包含所有修改的细节、用户信息）
        if (request.method === 'POST') {
            const body = await request.text();
            // 直接将整个 JSON 树存入 R2，实现一键备份转移
            await bucket.put('sealOfLove_FullData.json', body);
            return new Response(JSON.stringify({ success: true, message: "数据已安全同步至 R2 桶" }), { 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        return new Response('Method Not Allowed', { status: 405 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
