export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Твой URL проекта Supabase
    const targetUrl = new URL("https://dxoyyflsqrzgzjfihgcx.supabase.co" + url.pathname + url.search);
    
    const newRequest = new Request(targetUrl, request);
    
    return fetch(newRequest);
  }
};
