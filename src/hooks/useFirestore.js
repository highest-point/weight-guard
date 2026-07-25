import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';

export const useFirestoreDocument = (user, collectionPath, transformFn) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user?.uid || '', ...collectionPath.split('/'));
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (!user) {
        setData(null);
        setLoading(false);
        return;
      }
      if (snap.exists()) {
        const rawData = snap.data();
        if (transformFn) {
          setData(transformFn(rawData));
        } else {
          setData(rawData);
        }
      } else {
        setData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, collectionPath, transformFn]);

  return { data, loading };
};

export const useFirestoreList = (user, collectionPath, listKey = 'list') => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user?.uid || '', ...collectionPath.split('/'));
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }
      if (snap.exists()) {
        const data = snap.data();
        setItems(data[listKey] || []);
      } else {
        setItems([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, collectionPath, listKey]);

  return { items, loading };
};

export const useFirestoreLogs = (user, planId, dateStr) => {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user?.uid || '', 'data', `plan_${planId}_log_${dateStr}`);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (!user || !planId || !dateStr) {
        setLog(null);
        setLoading(false);
        return;
      }
      if (snap.exists()) {
        const data = snap.data();
        setLog({
          ...data,
          meals: data.meals || [],
          exercises: data.exercises || [],
          warnings: data.warnings || [],
          treatCount: data.treatCount || {},
          aiSummary: data.aiSummary || ''
        });
      } else {
        setLog({
          date: dateStr,
          consumed: 0,
          burned: 0,
          water: 0,
          weightMorning: '',
          weightEvening: '',
          meals: [],
          exercises: [],
          warnings: [],
          treatCount: {},
          aiSummary: ''
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, planId, dateStr]);

  return { log, loading };
};

export const useFirestoreHistory = (user, planId) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user?.uid || '', 'data', `plan_${planId}_history`);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (!user || !planId) {
        setHistory([]);
        setLoading(false);
        return;
      }
      if (snap.exists()) {
        setHistory(snap.data().records || []);
      } else {
        setHistory([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, planId]);

  return { history, loading };
};

export const useFirestoreBatch = (user) => {
  const saveList = async (collectionPath, list, listKey = 'list') => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, ...collectionPath.split('/'));
    await setDoc(docRef, { [listKey]: list, updatedAt: new Date().toISOString() }, { merge: true });
  };

  const saveDocument = async (collectionPath, data) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, ...collectionPath.split('/'));
    await setDoc(docRef, data, { merge: true });
  };

  const saveLog = async (planId, dateStr, logData) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', `plan_${planId}_log_${dateStr}`);
    await setDoc(docRef, logData, { merge: true });
  };

  const saveHistory = async (planId, historyData) => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', `plan_${planId}_history`);
    await setDoc(docRef, { records: historyData });
  };

  const getDocument = async (collectionPath) => {
    if (!user) return null;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, ...collectionPath.split('/'));
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  };

  return { saveList, saveDocument, saveLog, saveHistory, getDocument };
};

export const useFirestoreMultiple = (user, paths) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const readyCountRef = useRef(0);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!user) {
      setData({});
      setLoading(false);
      readyCountRef.current = 0;
      return;
    }

    readyCountRef.current = 0;
    const unsubscribers = [];

    paths.forEach((path) => {
      const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, ...path.split('/'));
      const unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          setData(prev => ({ ...prev, [path]: snap.data() }));
        } else {
          setData(prev => ({ ...prev, [path]: null }));
        }
        readyCountRef.current += 1;
        if (readyCountRef.current >= paths.length) {
          setLoading(false);
        }
      });
      unsubscribers.push(unsubscribe);
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [user, paths]);

  return { data, loading };
};