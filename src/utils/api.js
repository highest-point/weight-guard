/**
 * 安全的 API 请求封装
 * 提供统一的错误处理、超时控制、请求验证
 */

/**
 * API 请求配置
 */
const DEFAULT_CONFIG = {
  timeout: 30000, // 30秒超时
  retries: 1, // 重试次数
  retryDelay: 1000, // 重试延迟(毫秒)
};

/**
 * 创建超时 Promise
 * @param {number} ms - 超时时间(毫秒)
 * @returns {Promise<never>}
 */
const createTimeoutPromise = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`请求超时(${ms}ms)`));
    }, ms);
  });
};

/**
 * 安全的 HTTP GET 请求
 * @param {string} url - 请求地址
 * @param {Object} [options] - 请求选项
 * @param {Object} [options.headers] - 请求头
 * @param {number} [options.timeout] - 超时时间
 * @returns {Promise<any>}
 */
export const safeGet = async (url, options = {}) => {
  const timeout = options.timeout || DEFAULT_CONFIG.timeout;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await Promise.race([
      fetch(url, {
        method: 'GET',
        headers,
        credentials: 'same-origin',
      }),
      createTimeoutPromise(timeout),
    ]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('GET请求失败:', url, error);
    throw error;
  }
};

/**
 * 安全的 HTTP POST 请求
 * @param {string} url - 请求地址
 * @param {any} [data] - 请求体数据
 * @param {Object} [options] - 请求选项
 * @param {Object} [options.headers] - 请求头
 * @param {number} [options.timeout] - 超时时间
 * @param {number} [options.retries] - 重试次数
 * @returns {Promise<any>}
 */
export const safePost = async (url, data = null, options = {}) => {
  const timeout = options.timeout || DEFAULT_CONFIG.timeout;
  const retries = options.retries || DEFAULT_CONFIG.retries;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const doRequest = async () => {
    const response = await Promise.race([
      fetch(url, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : null,
        credentials: 'same-origin',
      }),
      createTimeoutPromise(timeout),
    ]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  };

  try {
    return await doRequest();
  } catch (error) {
    if (retries > 0 && (error.message.includes('超时') || error.message.includes('Network'))) {
      console.warn(`POST请求失败，重试中... (剩余${retries}次)`, url, error);
      await new Promise(resolve => setTimeout(resolve, DEFAULT_CONFIG.retryDelay));
      return await safePost(url, data, { ...options, retries: retries - 1 });
    }
    console.error('POST请求失败:', url, error);
    throw error;
  }
};

/**
 * 安全的文件上传请求
 * @param {string} url - 上传地址
 * @param {FormData} formData - 表单数据
 * @param {Object} [options] - 请求选项
 * @param {number} [options.timeout] - 超时时间
 * @returns {Promise<any>}
 */
export const safeUpload = async (url, formData, options = {}) => {
  const timeout = options.timeout || 60000; // 文件上传超时60秒
  const headers = {
    ...options.headers,
  };

  try {
    const response = await Promise.race([
      fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'same-origin',
      }),
      createTimeoutPromise(timeout),
    ]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('文件上传失败:', url, error);
    throw error;
  }
};

/**
 * 构建 URL 查询参数
 * @param {Object} params - 参数对象
 * @returns {string} 查询参数字符串
 */
export const buildQueryParams = (params) => {
  const validParams = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      validParams[key] = params[key];
    }
  });
  const searchParams = new URLSearchParams(validParams);
  return searchParams.toString();
};

/**
 * 安全地解析 JSON
 * @param {string} text - JSON字符串
 * @returns {{ success: boolean, data: any, error: Error | null }}
 */
export const safeJsonParse = (text) => {
  try {
    const data = JSON.parse(text);
    return { success: true, data, error: null };
  } catch (error) {
    console.error('JSON解析失败:', error);
    return { success: false, data: null, error };
  }
};

/**
 * 安全地获取对象属性
 * @param {Object} obj - 对象
 * @param {string} path - 属性路径(如 'a.b.c')
 * @param {any} [defaultValue] - 默认值
 * @returns {any} 属性值或默认值
 */
export const safeGetProperty = (obj, path, defaultValue = null) => {
  if (!obj) return defaultValue;
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }
  return result !== undefined ? result : defaultValue;
};