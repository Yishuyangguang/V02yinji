export async function onRequest(context) {
    const { request, env } = context;
    const bucket = env.MY_BUCKET; 

    if (!bucket) {
        return new Response(JSON.stringify({ error: "R2 Bucket 未绑定" }), { status: 500 });
    }

    try {
        if (request.method === 'GET') {
            const object = await bucket.get('sealOfLove_FullData.json');
            if (object === null) {
                return new Response(JSON.stringify({}), { headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(object.body, { headers: { 'Content-Type': 'application/json' } });
        }

        if (request.method === 'POST') {
            const body = await request.text();
            // 直接将全站数据存入 R2，极速覆盖
            await bucket.put('sealOfLove_FullData.json', body);
            return new Response(JSON.stringify({ success: true, message: "已极速同步至 R2 桶" }), { 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        return new Response('Method Not Allowed', { status: 405 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
