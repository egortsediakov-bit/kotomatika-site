function response(statusCode, data, origin='*') {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(data)
  };
}

function clean(value, max=500) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[<>]/g, '').trim().slice(0, max);
}

module.exports.handler = async function(event) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  const method = event.httpMethod || event.requestContext?.http?.method || 'POST';

  if (method === 'OPTIONS') return response(200, {ok:true}, allowedOrigin);
  if (method !== 'POST') return response(405, {ok:false,error:'Method not allowed'}, allowedOrigin);

  let raw = event.body || '{}';
  if (event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');

  let p;
  try { p = JSON.parse(raw); }
  catch { return response(400, {ok:false,error:'Invalid JSON'}, allowedOrigin); }

  const payload = {
    name: clean(p.name,120),
    student: clean(p.student,120),
    class: clean(p.class,30),
    goal: clean(p.goal,120),
    contact: clean(p.contact,200),
    comment: clean(p.comment,1000),
    source: clean(p.source,500)
  };

  if (!payload.name || !payload.student || !payload.class || !payload.goal || !payload.contact) {
    return response(400, {ok:false,error:'Required fields are missing'}, allowedOrigin);
  }

  try {
    const r = await fetch("https://script.google.com/macros/s/AKfycbzEWz1M4mZZ1hhe5PLJhGFnes9K39T2SuLMfjmegePpKQ5Ii6N_vEDj3dLMLkPqONTbwA/exec", {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
      redirect:'follow'
    });
    const text = await r.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}

    if (!r.ok || data.ok !== true) {
      console.error('Google Apps Script error', r.status, text.slice(0,500));
      return response(502, {ok:false,error:'Google Sheets delivery failed'}, allowedOrigin);
    }

    return response(200, {ok:true}, allowedOrigin);
  } catch (err) {
    console.error(err);
    return response(502, {ok:false,error:'Google Sheets delivery failed'}, allowedOrigin);
  }
};
