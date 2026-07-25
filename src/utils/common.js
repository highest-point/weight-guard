// Email utilities
export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name}***@${domain}`;
  return `${name.substring(0, 2)}***@${domain}`;
};

// Array utilities
export const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);