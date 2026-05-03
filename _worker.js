export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // ВАШ SUPABASE ДОМЕН (без https://)
    const TARGET_SUPABASE_URL = "dxoyyflsqrzgzjfihgcx.supabase.co"; 
    
    // Запоминаем оригинальный домен (вашего workers - sb-proxy-worker.pages.dev)
    const originalHostname = url.hostname;
    
    // Меняем домен назначения на Supabase
    url.hostname = TARGET_SUPABASE_URL;

    // Создаем новый запрос для отправки в Supabase
    const newRequest = new Request(url.toString(), request);
    
    // КРИТИЧНО ВАЖНО: Эти заголовки говорят серверу авторизации Supabase (GoTrue)
    // о том, какой на самом деле домен видит пользователь. 
    // Именно благодаря им сгенерируется правильный redirect_uri для Google!
    newRequest.headers.set('X-Forwarded-Host', originalHostname);
    newRequest.headers.set('X-Forwarded-Proto', 'https');
    
    // Возвращаем ответ от Supabase обратно пользователю
    return fetch(newRequest);
  }
};
