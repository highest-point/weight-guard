/**
 * 输入验证工具函数
 * 提供常用的表单验证方法
 */

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: '请输入邮箱地址' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: '请输入有效的邮箱地址' };
  }
  return { isValid: true, message: '' };
};

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @param {number} [minLength=6] - 最小长度
 * @returns {{ isValid: boolean, message: string, strength: 'weak' | 'medium' | 'strong' }}
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password) {
    return { isValid: false, message: '请输入密码', strength: 'weak' };
  }
  if (password.length < minLength) {
    return { isValid: false, message: `密码至少需要${minLength}位`, strength: 'weak' };
  }
  
  let strength = 'weak';
  let checks = 0;
  
  // 包含大写字母
  if (/[A-Z]/.test(password)) checks++;
  // 包含小写字母
  if (/[a-z]/.test(password)) checks++;
  // 包含数字
  if (/[0-9]/.test(password)) checks++;
  // 包含特殊字符
  if (/[^A-Za-z0-9]/.test(password)) checks++;
  
  if (checks >= 3 && password.length >= 8) {
    strength = 'strong';
  } else if (checks >= 2 || password.length >= 10) {
    strength = 'medium';
  }
  
  return { isValid: true, message: '', strength };
};

/**
 * 验证用户名
 * @param {string} username - 用户名
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateUsername = (username) => {
  if (!username) {
    return { isValid: false, message: '请输入用户名' };
  }
  if (username.length < 3) {
    return { isValid: false, message: '用户名至少需要3个字符' };
  }
  if (username.length > 20) {
    return { isValid: false, message: '用户名不能超过20个字符' };
  }
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, message: '用户名只能包含字母、数字和下划线' };
  }
  return { isValid: true, message: '' };
};

/**
 * 验证日期格式 (YYYY-MM-DD)
 * @param {string} date - 日期字符串
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateDate = (date) => {
  if (!date) {
    return { isValid: false, message: '请选择日期' };
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { isValid: false, message: '日期格式必须为 YYYY-MM-DD' };
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return { isValid: false, message: '无效的日期' };
  }
  return { isValid: true, message: '' };
};

/**
 * 验证数字范围
 * @param {number|string} value - 数值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {string} fieldName - 字段名称
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateNumberRange = (value, min, max, fieldName) => {
  const num = Number(value);
  if (isNaN(num)) {
    return { isValid: false, message: `${fieldName}必须是数字` };
  }
  if (num < min) {
    return { isValid: false, message: `${fieldName}不能小于${min}` };
  }
  if (num > max) {
    return { isValid: false, message: `${fieldName}不能大于${max}` };
  }
  return { isValid: true, message: '' };
};

/**
 * 验证时间格式 (HH:MM)
 * @param {string} time - 时间字符串
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateTime = (time) => {
  if (!time) {
    return { isValid: false, message: '请选择时间' };
  }
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time)) {
    return { isValid: false, message: '时间格式必须为 HH:MM' };
  }
  return { isValid: true, message: '' };
};

/**
 * 验证文件大小
 * @param {File} file - 文件对象
 * @param {number} maxSizeMB - 最大大小(MB)
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateFileSize = (file, maxSizeMB = 10) => {
  if (!file) {
    return { isValid: false, message: '请选择文件' };
  }
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { isValid: false, message: `文件大小不能超过${maxSizeMB}MB` };
  }
  return { isValid: true, message: '' };
};

/**
 * 验证文件类型
 * @param {File} file - 文件对象
 * @param {string[]} allowedTypes - 允许的MIME类型数组
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateFileType = (file, allowedTypes) => {
  if (!file) {
    return { isValid: false, message: '请选择文件' };
  }
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: `不支持的文件类型: ${file.type}` };
  }
  return { isValid: true, message: '' };
};

/**
 * 验证字符串不为空
 * @param {string} value - 字符串值
 * @param {string} fieldName - 字段名称
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateRequired = (value, fieldName) => {
  if (!value || value.trim() === '') {
    return { isValid: false, message: `${fieldName}不能为空` };
  }
  return { isValid: true, message: '' };
};

/**
 * 验证两个日期的先后顺序
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateDateOrder = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) {
    return { isValid: false, message: '结束日期不能早于开始日期' };
  }
  return { isValid: true, message: '' };
};

/**
 * 验证两个时间的先后顺序
 * @param {string} startTime - 开始时间
 * @param {string} endTime - 结束时间
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateTimeOrder = (startTime, endTime) => {
  if (startTime >= endTime) {
    return { isValid: false, message: '结束时间必须晚于开始时间' };
  }
  return { isValid: true, message: '' };
};