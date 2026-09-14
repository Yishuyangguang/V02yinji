export async function onRequestPost(context) {
    const { request, env } = context;
    if (!env.MY_BUCKET) return new Response(JSON.stringify({error: "R2 Bucket 未绑定"}), {status: 500});
    
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) throw new Error("未找到有效的文件数据");

        // 提取扩展名并生成唯一安全的云端文件名
        const ext = file.name.split('.').pop() || 'mp3';
        const uniqueName = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

        // 二进制流直传 R2，极速且不占用内存
        await env.MY_BUCKET.put(uniqueName, file.stream(), {
            httpMetadata: { contentType: file.type || 'audio/mpeg' }
        });

        return new Response(JSON.stringify({
            success: true,
            url: `/api/media/${uniqueName}`
        }), { headers: {'Content-Type': 'application/json'} });
    } catch(e) {
        return new Response(JSON.stringify({error: e.message}), {status: 500});
    }
}
