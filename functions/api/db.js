export async function onRequest(context) {
  const { request, env } = context;

  // 防御 1：检测存储桶是否正确挂载
  if (!env.MY_BUCKET) {
    return new Response(JSON.stringify({ error: "R2 存储桶 (MY_BUCKET) 未正确挂载，请检查后台绑定配置" }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
    });
  }

  // 处理前端拉取数据的 GET 请求
  if (request.method === "GET") {
    try {
      const object = await env.MY_BUCKET.get("db.json");
      
      // 防御 2：如果旧桶里没有 db.json，或者由于迁移导致读取不到，坚决不崩溃！
      // 返回一个空对象 {} 让前端的 initDB 自动重置，而不是抛出 500
      if (object === null) {
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // 正常返回数据
      return new Response(object.body, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      // 捕获系统级异常并返回明确的 JSON 格式错误，防止前端解析炸裂
      return new Response(JSON.stringify({ error: "读取数据异常: " + e.message }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
      });
    }
  }

  // 处理前端保存数据的 POST 请求
  if (request.method === "POST") {
    try {
      const data = await request.json();
      await env.MY_BUCKET.put("db.json", JSON.stringify(data));
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "保存数据异常: " + e.message }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
      });
    }
  }

  // 防御 3：拦截非预期的请求方法
  return new Response(JSON.stringify({ error: "请求方法不被允许" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
  });
}
