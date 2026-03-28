import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    
    // Listen for profile changes
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        // Auto-upgrade CEO role if email matches
        if (data.email === "enigmaticshafin@gmail.com" && data.role !== 'ceo') {
          await updateDoc(userDocRef, { role: 'ceo' });
          // The next snapshot will have the updated role
        } else {
          setProfile(data);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      // Only report error if we are still supposed to be logged in
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { user, profile, loading };
}
