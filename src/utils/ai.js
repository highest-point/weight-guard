// AI utilities
export const callVolcengineText = async (prompt, apiKey, endpoint) => {
  const res = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: endpoint,
      messages: [
        { role: 'system', content: '你是一个专业的营养与运动数据分析助手。请严格按照要求只输出JSON对象，不要输出任何Markdown标记符或其他说明文字。' },
        { role: 'user', content: prompt }
      ]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  let content = data.choices[0].message.content.trim();
  content = content.replace(/```json/g, '').replace(/```/g, '').trim();
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}') + 1;
  return JSON.parse(content.slice(start, end));
};

export const callVolcengineVision = async (base64Image, prompt, apiKey, endpoint) => {
  const res = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: endpoint,
      messages: [
        { role: 'system', content: '你是一个分析助手。请严格按照要求只输出JSON对象，不要输出任何Markdown标记符或其他说明文字。' },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: base64Image } }
          ]
        }
      ]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  let content = data.choices[0].message.content.trim();
  content = content.replace(/```json/g, '').replace(/```/g, '').trim();
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}') + 1;
  return JSON.parse(content.slice(start, end));
};