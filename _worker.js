export default {
  async fetch(request) {
    const SUPABASE_URL = "https://dxoyyflsqrzgzjfihgcx.supabase.co"; // Оригинальный адрес
    const SUPABASE_HOST = "dxoyyflsqrzgzjfihgcx.supabase.co"; 
    
    const url = new URL(request.url);
    const proxyHost = url.host; // Например: sb-proxy-worker.pages.dev

    // Быстрый ответ на CORS-запросы (префлайты)
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        });
    }

    const targetUrl = new URL(url.pathname + url.search, SUPABASE_URL);

    // Важно: redirect: "manual" не дает Worker'у автоматически следовать по редиректу.
    // Нам нужно перехватить ответ от Supabase, чтобы изменить внутри него ссылки!
    const init = {
        method: request.method,
        headers: new Headers(request.headers),
        redirect: "manual" 
    };

    // Передаем правильные хосты для внутреннего роутинга Supabase (GoTrue)
    init.headers.set("Host", SUPABASE_HOST);
    init.headers.set("X-Forwarded-Host", proxyHost);
    init.headers.set("X-Forwarded-Proto", "https");

    // Если есть тело запроса (POST, PATCH и т.д.) — передаем его
    if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = request.body;
    }

    try {
        const response = await fetch(targetUrl, init);

        // Клонируем ответ, чтобы можно было изменить заголовки
        const newResponse = new Response(response.body, response);

        // ПЕРЕХВАТ РЕДИРЕКТОВ (включая редирект на аккаунт Google)
        if ([301, 302, 303, 307, 308].includes(response.status)) {
            let location = newResponse.headers.get("Location");
            if (location) {
                // Google получает ссылку в виде URL-кодированного параметра.
                // Подменяем оригинальную ссылку `.supabase.co` на наш `proxy.pages.dev`
                const encodedSupabase = encodeURIComponent(SUPABASE_URL);
                const encodedProxy = encodeURIComponent(`https://${proxyHost}`);
                
                location = location.split(encodedSupabase).join(encodedProxy);
                location = location.split(SUPABASE_URL).join(`https://${proxyHost}`);
                
                newResponse.headers.set("Location", location);
            }
        }

        // Принудительно разрешаем CORS, чтобы браузер не блокировал ответы
        newResponse.headers.set("Access-Control-Allow-Origin", "*");
        
        return newResponse;

    } catch (e) {
        return new Response("Proxy Error: " + e.message, { status: 500 });
    }
  }
};
