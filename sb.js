const https = require("https");

const SB_URL = "xubygbcsvmphbggnzhbt.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1YnlnYmNzdm1waGJnZ256aGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDg2MTQsImV4cCI6MjA5NjQyNDYxNH0.Q3p09tiRBjiBWXsh2mnqwtlER7MxH3VOwfe26o5iIHI";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Content-Type": "application/json"
};

function sbRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SB_URL,
      path: "/rest/v1/" + path,
      method: method,
      headers: {
        "apikey": SB_KEY,
        "Authorization": "Bearer " + SB_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=merge-duplicates"
      }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  try {
    const p = event.queryStringParameters || {};
    const table  = p.table;
    const filter = p.filter || "";
    const order  = p.order  || "";
    const limit  = p.limit  || "";

    if (!table) return { statusCode: 400, headers: CORS, body: JSON.stringify({error:"table required"}) };

    let path = table + "?select=*";
    if (filter) path += "&" + filter;
    if (order)  path += "&order=" + order + ".desc";
    if (limit)  path += "&limit=" + limit;

    const body = event.body ? JSON.parse(event.body) : null;

    // upsert لـ push_tokens (منع التكرار)
    if(table === 'push_tokens' && event.httpMethod === 'POST'){
      const upsertPath = table+'?on_conflict=token';
      const result2 = await sbRequest('POST', upsertPath, body);
      return {statusCode:result2.status, headers:CORS, body:result2.body};
    }

    const result = await sbRequest(event.httpMethod, path, body);

    return { statusCode: result.status, headers: CORS, body: result.body };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
