export async function onRequestGet(context) {
    const { env, params } = context;
    // 捕获动态路径中的文件名
    const filename = params.path[0];
    if (!filename) return new Response('Not found', {status: 404});

    // 从 R2 提取对象
    const obj = await env.MY_BUCKET.get(filename);
    if (!obj) return new Response('File Not found', {status: 404});

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('etag', obj.httpEtag);
    // 允许浏览器通过音频标签进行拖拽缓冲
    headers.set('Accept-Ranges', 'bytes');

    return new Response(obj.body, { headers });
}
