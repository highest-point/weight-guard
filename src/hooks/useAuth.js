import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  updatePassword, 
  updateProfile, 
  verifyBeforeUpdateEmail, 
  sendPasswordResetEmail, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { VIRTUAL_EMAIL_DOMAIN } from '../constants';

/**
 * 用户认证状态 Hook
 * @returns {{ user: FirebaseAuth.User | null, loading: boolean }} 用户信息和加载状态
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
};

/**
 * 用户认证操作 Hook
 * 提供登录、注册、登出、更新用户信息等操作
 * @returns {Object} 认证操作方法集合
 */
export const useAuthActions = () => {
  /**
   * 登出用户
   * @returns {Promise<void>}
   */
  const signOutUser = async () => {
    await signOut(auth);
  };

  /**
   * 更新用户密码
   * @param {string} newPassword - 新密码
   * @returns {Promise<void>}
   * @throws {Error} 如果没有用户登录
   */
  const updateUserPassword = async (newPassword) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    await updatePassword(auth.currentUser, newPassword);
  };

  /**
   * 更新用户资料
   * @param {Object} profileData - 用户资料数据
   * @param {string} [profileData.displayName] - 显示名称
   * @param {string} [profileData.photoURL] - 头像URL
   * @returns {Promise<void>}
   * @throws {Error} 如果没有用户登录
   */
  const updateUserProfile = async (profileData) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    await updateProfile(auth.currentUser, profileData);
  };

  /**
   * 更新用户邮箱（需要验证）
   * @param {string} newEmail - 新邮箱地址
   * @returns {Promise<void>}
   * @throws {Error} 如果没有用户登录
   */
  const updateUserEmail = async (newEmail) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
  };

  /**
   * 发送密码重置邮件
   * @param {string} email - 用户邮箱
   * @returns {Promise<void>}
   */
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  /**
   * 注册新用户
   * 使用虚拟邮箱域名创建用户
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<FirebaseAuth.User>} 创建的用户对象
   */
  const registerUser = async (username, password) => {
    const email = `${username.toLowerCase()}${VIRTUAL_EMAIL_DOMAIN}`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: username });
    return userCredential.user;
  };

  /**
   * 用户登录
   * 支持用户名或邮箱登录
   * @param {string} usernameOrEmail - 用户名或邮箱
   * @param {string} password - 密码
   * @returns {Promise<FirebaseAuth.User>} 登录的用户对象
   */
  const loginUser = async (usernameOrEmail, password) => {
    const isRealEmail = usernameOrEmail.includes('@');
    const email = isRealEmail ? usernameOrEmail.trim() : `${usernameOrEmail.toLowerCase()}${VIRTUAL_EMAIL_DOMAIN}`;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  /**
   * 判断用户是否绑定了真实邮箱
   * @param {FirebaseAuth.User} user - 用户对象
   * @returns {boolean} 是否绑定真实邮箱
   */
  const isEmailBound = (user) => {
    return user?.email && !user.email.endsWith(VIRTUAL_EMAIL_DOMAIN);
  };

  return {
    signOutUser,
    updateUserPassword,
    updateUserProfile,
    updateUserEmail,
    resetPassword,
    registerUser,
    loginUser,
    isEmailBound
  };
};