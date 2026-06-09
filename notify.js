const https = require("https");
const crypto = require("crypto");

// ── Supabase ──
const SB_HOST = "xubygbcsvmphbggnzhbt.supabase.co";
const SB_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1YnlnYmNzdm1waGJnZ256aGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDg2MTQsImV4cCI6MjA5NjQyNDYxNH0.Q3p09tiRBjiBWXsh2mnqwtlER7MxH3VOwfe26o5iIHI";

// ── Firebase Service Account ──
const SA = {
  project_id:   "critical-reports",
  client_email: "firebase-adminsdk-fbsvc@critical-reports.iam.gserviceaccount.com",
  private_key:  "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCc1UdPYiDnmi1d\n1Jw57JRRtySnW7WHJxBXRz9kWLrHWxLfjZ1wfH2FKAQb0KQ1RmvFGcBs2ELOUQeL\nncbosqEya2flapjrxIQpwFJlJuShQCJKRnW50IzMkpF3d3d42Wm6o+c5/rHb8jcC\nTo0w/+UeRM2ekiKLrSQKFFRiQbVNY35CpF+5ZW0jmIeQjpNeneeAE40p/A1on3RT\nRXr5guzitOl9MsVmEhuH8TSKWeIeAJ5B7SxOddMmr69ec6ZTD/uKzlOalqR+DdIK\nO35vECsoRjVc41BjmRl+MIU3n5j5WdCPvZbDSzF+kf89d1BO71kmuJ7pK2prMqsn\nb1j8t/gdAgMBAAECggEACwSAqfb+0MZoAXt6LieMk+EF1iv/KKt53mfG8Em7dV3U\niZftQ4W7W6tf/oQ9xPBZidMxTXQz3UKcARboblh+MoiRF/DRJV782eIE584/qYRT\n5Fvm0VLxUT3KslXWMsszPkVdbRmTbRwq+SKDkLmpYuL6fvVNL/rN2VdsRirPjcwf\nXJtfmlO+nFvRKazwB0/8LJDYGsonoVJ7JaukpxKEwor5vWlG09B2+2yFGrbOq1C6\nMZfTGAtOdpmdiwV0uTg2iPQHwBC7U3983gRjiJ5Cwatf/8RUkqaCwMx2bwC+oHd1\nz3wXPX2w6prN1tRu9yMDIwRvJFcpnEBCuRnuVMxmkQKBgQDOD0rOMfi4sBL51Tku\ny2/rvDfoYH1V257LSuxKf4Nsr4feptn2MZOqqdVkVQghYDXCWlzuvKpMDR91C2Xt\nFMg3qA0EgOAaKUDeKSPuYr9bFpREncbkyqdhXdOIlLUpv5JLLHgeBCDGpgPbvnHA\nOPujG4zYf/vhgxBzeZCl19NxhwKBgQDC18j8o3w4yFluScj0PcV6EPq+m41DCMU/\n0l5l7XpIiXzfqs7mDZxPu+JmmoXxjgG2L/VmuUBg9fj6O8FzCKBM1CfNpkCxr5yr\nENdrvQk61RRgq0w4f6PLvMPJENWow4+RdPV5GobO6pYe9P91MoiaWe4LwunPce1W\n9skoNIhCOwKBgHxEZqWRJ2Eh9l+qgjDBST7OJJ1ES3HS36HUDkojOjv6Y6MX1oyN\ne3NJtsIqMZwHLISIAFGNf9obc+QfOpnOlaxS8X7MxdmhFVilUOD7tlEVfdcfm4nw\n2R5z+hT9MX/64xvotovLi4ShK+SCppD5DHBiNf9+t4VZiDtLjbsmPILTAoGBALM/\n2YOy06FZkAzKjLlF6tr1q/iXGkpFU1H3syiKZSk+c0dB2L4EX31rGEnUds1XG3QE\ngvtSCkwpfjiXqMyvbum/dC7ZeEL/kF5ATC6t5kPdq7WTYbfIlWPl8SiU+DseToI+\n22XiZYsOfbVVJ38mUk3N1hWz524VHYgX2c/HJGPpAoGAaOjqnDsPaGJIEAsHWfT/\nBqQWDYqYwEpDBYvEj4HPAoF0NSu6RA48oy76/G9Cto6xTBl862Rzxyv98ET+CVIH\nvyf3HjCACjNXZQaItdSO0goOZShoTl1AUu5mWrxq0uq/9n1rdrHe/APSux6xj+1t\nvs5DwOlhkHUcI+o7gQ8Ux4A=\n-----END PRIVATE KEY-----\n"
};

const CORS = {
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"Content-Type",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  "Content-Type":"application/json"
};

// ── JWT for Google OAuth2 ──
function base64url(buf){
  return buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

async function getAccessToken(){
  const now = Math.floor(Date.now()/1000);
  const header = base64url(Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT'})));
  const claim  = base64url(Buffer.from(JSON.stringify({
    iss: SA.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now+3600, iat: now
  })));
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(header+'.'+claim);
  const sig = base64url(sign.sign(SA.private_key));
  const jwt = header+'.'+claim+'.'+sig;

  return new Promise((resolve,reject)=>{
    const body = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion='+jwt;
    const req = https.request({
      hostname:'oauth2.googleapis.com', path:'/token', method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded','Content-Length':Buffer.byteLength(body)}
    }, res=>{
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>{ try{resolve(JSON.parse(d).access_token);}catch(e){reject(e);} });
    });
    req.on('error',reject); req.write(body); req.end();
  });
}

// ── Send FCM v1 message ──
function sendFCM(token, title, body, data, accessToken){
  return new Promise((resolve,reject)=>{
    const msg = {
      message:{
        token,
        notification:{ title, body },
        data: Object.fromEntries(Object.entries(data||{}).map(([k,v])=>[k,String(v)])),
        android:{ priority:'high', notification:{ sound:'default', channel_id:'critical' }},
        apns:{ headers:{'apns-priority':'10'}, payload:{ aps:{ sound:'default', badge:1 }}}
      }
    };
    const payload = JSON.stringify(msg);
    const req = https.request({
      hostname:'fcm.googleapis.com',
      path:`/v1/projects/${SA.project_id}/messages:send`,
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+accessToken,
        'Content-Length':Buffer.byteLength(payload)
      }
    }, res=>{
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>resolve({status:res.statusCode,body:d}));
    });
    req.on('error',reject); req.write(payload); req.end();
  });
}

// ── Get tokens from Supabase ──
function getTokens(centerId){
  return new Promise((resolve,reject)=>{
    const req = https.request({
      hostname:SB_HOST,
      path:`/rest/v1/push_tokens?select=token&center_id=eq.${centerId}`,
      method:'GET',
      headers:{ 'apikey':SB_KEY, 'Authorization':'Bearer '+SB_KEY }
    }, res=>{
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>{ try{resolve(JSON.parse(d||'[]'));}catch(e){resolve([]);} });
    });
    req.on('error',()=>resolve([])); req.end();
  });
}

// ── Handler ──
exports.handler = async function(event){
  if(event.httpMethod==='OPTIONS') return {statusCode:200,headers:CORS,body:''};
  if(event.httpMethod!=='POST')    return {statusCode:405,headers:CORS,body:JSON.stringify({error:'Method not allowed'})};

  try{
    const {centerId,reportId,title,body,data} = JSON.parse(event.body||'{}');
    if(!centerId) return {statusCode:400,headers:CORS,body:JSON.stringify({error:'centerId required'})};

    const [tokens, accessToken] = await Promise.all([
      getTokens(centerId),
      getAccessToken()
    ]);

    if(!tokens.length) return {statusCode:200,headers:CORS,body:JSON.stringify({sent:0,msg:'No tokens'})};

    const results = await Promise.all(
      tokens.map(({token})=> sendFCM(token, title||'🚨 بلاغ حرج جديد', body||'', data||{reportId}, accessToken))
    );

    return {statusCode:200,headers:CORS,body:JSON.stringify({sent:results.length,results})};
  }catch(e){
    return {statusCode:500,headers:CORS,body:JSON.stringify({error:e.message})};
  }
};
