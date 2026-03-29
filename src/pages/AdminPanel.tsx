import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, increment, runTransaction, query, orderBy, writeBatch, getDocs, setDoc } from 'firebase/firestore';
import { Mission, MissionSubmission, Withdrawal, UserProfile, ActivationRequest, PaymentSettings, GiftCode, LevelConfig, DepositRequest, SocialSellSubmission, DynamicSettings } from '../types';
import { 
  Plus, Check, X, Users as UsersIcon, ListTodo, Landmark, Eye, 
  ShieldCheck, AlertCircle, Clock, CheckCircle2, TrendingUp, 
  UserPlus, Ban, Search, Filter, ArrowUpRight, History, Trash2, Edit3, ExternalLink, DollarSign, Settings as SettingsIcon, Save,
  Gift, Award, ArrowDownCircle, ArrowUpCircle, Copy, XCircle, Share2, Smartphone, ShieldAlert, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export function AdminPanel() {
  const { theme } = useTheme();
  const { profile, loading } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activationRequests, setActivationRequests] = useState<ActivationRequest[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({ bKash: '', Nagad: '', Rocket: '', activationFee: 20 });
  const [activeTab, setActiveTab] = useState<'submissions' | 'withdrawals' | 'deposits' | 'activations' | 'missions' | 'users' | 'giftcodes' | 'levels' | 'settings' | 'socialsells' | 'addnumber'>('users');
  const [subFilter, setSubFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [withFilter, setWithFilter] = useState<'pending' | 'completed' | 'rejected'>('pending');
  const [depFilter, setDepFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [actFilter, setActFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [sellFilter, setSellFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>([]);
  const [levelConfigs, setLevelConfigs] = useState<LevelConfig[]>([]);
  const [socialSells, setSocialSells] = useState<SocialSellSubmission[]>([]);
  const [dynamicSettings, setDynamicSettings] = useState<DynamicSettings>({
    telegramGroup: '',
    telegramChannel: '',
    telegramSupport: '',
    meetingGroup: '',
    welcomeTitle: 'Welcome to our website',
    welcomeText: 'We are here to help you earn money online.',
    footerQuote: 'This should be used to tell a story and include any friend you might receive money and service for your teams.',
    quoteAuthor: 'Shoaiba Islam',
    footerText: 'Digital Nova'
  });
  const [newGiftCode, setNewGiftCode] = useState({ code: '', amount: '', maxUses: '' });
  const [newLevel, setNewLevel] = useState({ level: '', name: '', minReferrals: '' });
  const [withdrawSettings, setWithdrawSettings] = useState({ minWithdraw: 500, maxWithdraw: 10000 });
  const [depositSettings, setDepositSettings] = useState({ bkash: '', nagad: '', rocket: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMission, setShowAddMission] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [newMission, setNewMission] = useState({ title: '', description: '', reward: '', category: '', link: '' });
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    userId: '',
    role: 'user' as UserProfile['role'],
    balance: '0',
    status: 'active' as UserProfile['status']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (loading || (profile?.role !== 'admin' && profile?.role !== 'moderator' && profile?.role !== 'ceo')) return;

    const unsubGiftCodes = onSnapshot(collection(db, 'giftCodes'), (snap) => {
      setGiftCodes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as GiftCode)));
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'giftCodes');
      }
    });

    const unsubLevels = onSnapshot(query(collection(db, 'levelConfigs'), orderBy('minReferrals', 'asc')), (snap) => {
      setLevelConfigs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as LevelConfig)));
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'levelConfigs');
      }
    });

    const unsubWithdrawSettings = onSnapshot(doc(db, 'settings', 'withdraw'), (snap) => {
      if (snap.exists()) setWithdrawSettings(snap.data() as any);
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'settings/withdraw');
      }
    });

    const unsubDepositSettings = onSnapshot(doc(db, 'settings', 'payment'), (snap) => {
      if (snap.exists()) setDepositSettings(snap.data() as any);
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'settings/payment');
      }
    });

    const unsubMissions = onSnapshot(query(collection(db, 'missions'), orderBy('createdAt', 'desc')), (snap) => {
      setMissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission)));
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'missions');
      }
    });

    const unsubSubmissions = onSnapshot(query(collection(db, 'missionSubmissions'), orderBy('submittedAt', 'desc')), (snap) => {
      setSubmissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MissionSubmission)));
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'missionSubmissions');
      }
    });

    const unsubWithdrawals = onSnapshot(query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc')), (snap) => {
      setWithdrawals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal)));
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'withdrawals');
      }
    });

    const unsubDeposits = onSnapshot(query(collection(db, 'deposits'), orderBy('submittedAt', 'desc')), (snap) => {
      setDeposits(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepositRequest)));
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'deposits');
      }
    });

    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snap) => {
      setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'users');
      }
    });

    const unsubActivations = onSnapshot(query(collection(db, 'activationRequests'), orderBy('submittedAt', 'desc')), (snap) => {
      setActivationRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivationRequest)));
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'activationRequests');
      }
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'paymentNumbers'), (snap) => {
      if (snap.exists()) {
        setPaymentSettings(snap.data() as PaymentSettings);
      }
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'settings/paymentNumbers');
      }
    });

    const unsubSocialSells = onSnapshot(query(collection(db, 'socialSells'), orderBy('submittedAt', 'desc')), (snap) => {
      setSocialSells(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as SocialSellSubmission)));
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'socialSells');
      }
    });

    const unsubDynamicSettings = onSnapshot(doc(db, 'dynamicSettings', 'main'), (snap) => {
      if (snap.exists()) {
        setDynamicSettings(snap.data() as DynamicSettings);
      }
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, 'dynamicSettings/main');
      }
    });

    return () => {
      unsubMissions();
      unsubSubmissions();
      unsubWithdrawals();
      unsubDeposits();
      unsubUsers();
      unsubActivations();
      unsubSettings();
      unsubGiftCodes();
      unsubLevels();
      unsubWithdrawSettings();
      unsubDepositSettings();
      unsubSocialSells();
      unsubDynamicSettings();
    };
  }, [profile, loading]);

  const handleCreateGiftCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'giftCodes'), {
        code: newGiftCode.code.toUpperCase(),
        amount: parseFloat(newGiftCode.amount),
        maxUses: parseInt(newGiftCode.maxUses),
        usageLimit: parseInt(newGiftCode.maxUses),
        usedCount: 0,
        usedBy: [],
        status: 'active',
        createdAt: new Date().toISOString()
      });
      setNewGiftCode({ code: '', amount: '', maxUses: '' });
      alert('Gift code created!');
    } catch (error) {
      console.error('Error creating gift code:', error);
    }
  };

  const handleDeleteGiftCode = async (id: string) => {
    if (!window.confirm('Delete this gift code?')) return;
    await deleteDoc(doc(db, 'giftCodes', id));
  };

  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'levelConfigs', `level_${newLevel.level}`), {
        level: parseInt(newLevel.level),
        name: newLevel.name,
        minReferrals: parseInt(newLevel.minReferrals)
      });
      setNewLevel({ level: '', name: '', minReferrals: '' });
      alert('Level updated!');
    } catch (error) {
      // Create if not exists
      await runTransaction(db, async (transaction) => {
        transaction.set(doc(db, 'levelConfigs', `level_${newLevel.level}`), {
          level: parseInt(newLevel.level),
          name: newLevel.name,
          minReferrals: parseInt(newLevel.minReferrals)
        });
      });
      setNewLevel({ level: '', name: '', minReferrals: '' });
      alert('Level created!');
    }
  };

  const handleDeleteLevel = async (level: number) => {
    if (!window.confirm('Delete this level configuration?')) return;
    try {
      await deleteDoc(doc(db, 'levelConfigs', `level_${level}`));
      alert('Level deleted!');
    } catch (error) {
      console.error('Error deleting level:', error);
    }
  };

  const handleUpdateWithdrawSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'settings', 'withdraw'), withdrawSettings, { merge: true });
      setMessage({ type: 'success', text: 'Withdrawal settings updated!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/withdraw');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDepositSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'settings', 'payment'), depositSettings, { merge: true });
      setMessage({ type: 'success', text: 'Deposit settings updated!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.role !== 'ceo') {
      setMessage({ type: 'error', text: 'Only CEO can update payment settings' });
      return;
    }
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'settings', 'paymentNumbers'), paymentSettings as any, { merge: true });
      setMessage({ type: 'success', text: 'Activation settings updated successfully!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/paymentNumbers');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDynamicSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'dynamicSettings', 'main'), dynamicSettings as any, { merge: true });
      setMessage({ type: 'success', text: 'Dynamic settings updated successfully!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'dynamicSettings/main');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveSocialSell = async (sell: SocialSellSubmission) => {
    if (!window.confirm('Approve this sell request?')) return;
    try {
      await updateDoc(doc(db, 'socialSells', sell.id), { status: 'approved' });
      alert('Sell request approved!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `socialSells/${sell.id}`);
    }
  };

  const handleRejectSocialSell = async (id: string) => {
    const note = window.prompt('Enter rejection reason:');
    if (note === null) return;
    try {
      await updateDoc(doc(db, 'socialSells', id), { status: 'rejected', adminNote: note });
      alert('Sell request rejected.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `socialSells/${id}`);
    }
  };

  const handleAddMission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMission) {
        await updateDoc(doc(db, 'missions', editingMission.id), {
          ...newMission,
          reward: parseFloat(newMission.reward),
        });
      } else {
        await addDoc(collection(db, 'missions'), {
          ...newMission,
          reward: parseFloat(newMission.reward),
          status: 'active',
          createdAt: new Date().toISOString(),
        });
      }
      setNewMission({ title: '', description: '', reward: '', category: '', link: '' });
      setEditingMission(null);
      setShowAddMission(false);
    } catch (error) {
      console.error("Mission operation error:", error);
    }
  };

  const handleDeleteMission = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this mission?')) return;
    try {
      await deleteDoc(doc(db, 'missions', id));
    } catch (error) {
      console.error("Delete mission error:", error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (profile?.role !== 'ceo' && profile?.role !== 'admin') {
      alert("Only the CEO or Admin can edit user details.");
      return;
    }

    const newId = editForm.userId;
    const currentId = editingUser.userId || '';
    const newRole = editForm.role;
    const newBalance = parseFloat(editForm.balance);
    const newStatus = editForm.status;

    if (!/^\d{8}$/.test(newId)) {
      alert("ID must be exactly 8 digits.");
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', editingUser.uid);
        
        // If ID changed, update referral_lookup
        if (newId !== currentId) {
          const lookupRef = doc(db, 'referral_lookup', newId);
          const oldLookupRef = doc(db, 'referral_lookup', currentId);
          
          const lookupDoc = await transaction.get(lookupRef);
          if (lookupDoc.exists() && lookupDoc.data().uid !== editingUser.uid) {
            throw new Error("User ID already in use.");
          }

          transaction.set(lookupRef, {
            uid: editingUser.uid,
            userName: editingUser.userName,
            userId: newId
          });

          if (currentId) {
            transaction.delete(oldLookupRef);
          }
        }

        transaction.update(userRef, {
          userId: newId,
          referralCode: newId,
          role: newRole,
          balance: newBalance,
          status: newStatus
        });
      });

      alert('User updated successfully!');
      setEditingUser(null);
    } catch (error: any) {
      console.error("Update User error:", error);
      alert(error.message || 'Failed to update user.');
    }
  };

  const handleApproveSubmission = async (submission: MissionSubmission) => {
    try {
      await runTransaction(db, async (transaction) => {
        const subRef = doc(db, 'missionSubmissions', submission.id);
        const userRef = doc(db, 'users', submission.userId);
        
        const reward = submission.reward || 0;

        transaction.update(subRef, { status: 'approved' });
        transaction.update(userRef, { 
          balance: increment(reward),
          totalEarned: increment(reward)
        });
      });
    } catch (error) {
      console.error("Approval error:", error);
    }
  };

  const handleRejectSubmission = async (id: string) => {
    const note = window.prompt('Enter rejection reason (optional):');
    try {
      await updateDoc(doc(db, 'missionSubmissions', id), { 
        status: 'rejected',
        adminNote: note || ''
      });
    } catch (error) {
      console.error("Reject error:", error);
    }
  };

  const handleCompleteWithdrawal = async (withdrawal: Withdrawal) => {
    try {
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), { status: 'completed' });
    } catch (error) {
      console.error("Complete withdrawal error:", error);
    }
  };

  const handleRejectWithdrawal = async (withdrawal: Withdrawal) => {
    if (!window.confirm('Reject this withdrawal?')) return;
    try {
      await runTransaction(db, async (transaction) => {
        const withdrawalRef = doc(db, 'withdrawals', withdrawal.id);
        const userRef = doc(db, 'users', withdrawal.userId);

        transaction.update(withdrawalRef, { status: 'rejected' });
        transaction.update(userRef, { balance: increment(withdrawal.amount) });
      });
      alert('Withdrawal rejected and balance refunded!');
    } catch (error) {
      console.error("Reject withdrawal error:", error);
    }
  };

  const handleApproveDeposit = async (request: DepositRequest) => {
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', request.userId);
        const userSnap = await transaction.get(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          transaction.update(userRef, {
            balance: (userData.balance || 0) + request.amount,
            totalEarned: (userData.totalEarned || 0) + request.amount
          });
        }
        transaction.update(doc(db, 'deposits', request.id), { status: 'approved' });
      });
      alert('Deposit approved and balance credited!');
    } catch (error) {
      console.error("Approve deposit error:", error);
    }
  };

  const handleRejectDeposit = async (id: string) => {
    if (!window.confirm('Reject this deposit request?')) return;
    try {
      await updateDoc(doc(db, 'deposits', id), { status: 'rejected' });
      alert('Deposit rejected!');
    } catch (error) {
      console.error("Reject deposit error:", error);
    }
  };

  const handleMigrateUserIds = async () => {
    if (profile?.role !== 'ceo') return;
    if (!window.confirm('This will migrate all User IDs to the new 8-digit format. Continue?')) return;
    
    let migratedCount = 0;
    try {
      for (const u of users) {
        if (u.userId && u.userId.length < 8) {
          const newId = u.userId.padStart(8, '0');
          await runTransaction(db, async (transaction) => {
            const userRef = doc(db, 'users', u.uid);
            const lookupRef = doc(db, 'referral_lookup', newId);
            const oldLookupRef = doc(db, 'referral_lookup', u.userId!);

            transaction.update(userRef, { 
              userId: newId,
              referralCode: newId 
            });

            transaction.set(lookupRef, {
              uid: u.uid,
              userName: u.userName,
              userId: newId
            });

            if (u.userId !== newId) {
              transaction.delete(oldLookupRef);
            }
          });
          migratedCount++;
        }
      }
      alert(`Successfully migrated ${migratedCount} users to 8-digit IDs.`);
    } catch (error) {
      console.error("Migration error:", error);
      alert('Migration failed. Check console for details.');
    }
  };

  const handleDeleteUser = async (userId: string, userRole?: string) => {
    if (userRole === 'ceo') {
      alert("CEO cannot be deleted.");
      return;
    }
    if (profile?.role !== 'ceo') {
      alert("Only the CEO can delete users.");
      return;
    }
    if (!window.confirm('CRITICAL: Are you sure you want to PERMANENTLY DELETE this user? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      alert('User deleted successfully.');
    } catch (error) {
      console.error("Delete user error:", error);
    }
  };

  const handleApproveActivation = async (request: ActivationRequest) => {
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, 'activationRequests', request.id);
        const userRef = doc(db, 'users', request.userId);
        
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) return;
        
        const userData = userSnap.data();
        const referrerId = userData.referredBy;

        transaction.update(reqRef, { status: 'approved' });
        transaction.update(userRef, { status: 'active' });

        // Increment referrer's referral count if they exist
        if (referrerId) {
          // Find referrer by their 8-digit userId
          const referrerLookupRef = doc(db, 'referral_lookup', referrerId);
          const lookupSnap = await transaction.get(referrerLookupRef);
          
          if (lookupSnap.exists()) {
            const referrerUid = lookupSnap.data().uid;
            const referrerRef = doc(db, 'users', referrerUid);
            transaction.update(referrerRef, {
              referrals: increment(1)
            });
          }
        }
      });
      alert('Activation approved!');
    } catch (error) {
      console.error("Approve activation error:", error);
      alert('Failed to approve activation.');
    }
  };

  const handleRejectActivation = async (id: string) => {
    try {
      await updateDoc(doc(db, 'activationRequests', id), { status: 'rejected' });
    } catch (error) {
      console.error("Reject activation error:", error);
    }
  };

  const handleDeactivateAll = async () => {
    if (profile?.role !== 'ceo') {
      alert("Only the CEO can perform this action.");
      return;
    }

    if (!window.confirm("Are you sure you want to deactivate ALL users? This will set everyone's status to 'inactive' and they will need to pay for activation again.")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      let count = 0;
      
      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        // Don't deactivate the CEO or admins if needed, but usually just CEO
        if (userData.role !== 'ceo') {
          batch.update(userDoc.ref, { status: 'inactive' });
          count++;
          
          // Firestore batch limit is 500
          if (count >= 450) {
            await batch.commit();
            count = 0;
          }
        }
      }

      if (count > 0) {
        await batch.commit();
      }
      
      alert("All users have been deactivated successfully.");
    } catch (error) {
      console.error("Error deactivating users:", error);
      alert("Failed to deactivate users.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { label: 'Total Agents', value: users.length, icon: UsersIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Payouts', value: `$${withdrawals.filter(w => w.status === 'completed').reduce((acc, w) => acc + w.amount, 0).toFixed(2)}`, icon: Landmark, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Agent Earnings', value: `$${users.reduce((acc, u) => acc + (u.totalEarned || 0), 0).toFixed(2)}`, icon: DollarSign, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: 'Total Referrals', value: users.reduce((acc, u) => acc + (u.referrals || 0), 0), icon: UserPlus, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const userMatches = users.filter(u => 
    u.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.userId?.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;

  const subMatches = submissions.filter(s => 
    s.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.missionTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;

  const withMatches = withdrawals.filter(w => 
    w.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.method?.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;

  const missionMatches = missions.filter(m => 
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;

  const actMatches = activationRequests.filter(a => 
    a.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.paymentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;

  const depMatches = deposits.filter(d => 
    d.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.paymentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;

  const sellMatches = socialSells.filter(s => 
    s.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.platform?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ).length;

  const filteredUsers = users.filter(u => 
    u.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.userId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubmissions = submissions.filter(s => 
    s.status === subFilter && (
      s.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.missionTitle?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredWithdrawals = withdrawals.filter(w => 
    w.status === withFilter && (
      w.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.method?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredMissions = missions.filter(m => 
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivations = activationRequests.filter(a => 
    a.status === actFilter && (
      a.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.paymentNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.senderNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const isUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return text.startsWith('http');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (profile?.role !== 'admin' && profile?.role !== 'moderator' && profile?.role !== 'ceo') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={cn(
          "max-w-md w-full rounded-[2.5rem] p-10 border text-center space-y-6",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tight">Access <span className="text-rose-500">Denied</span></h2>
            <p className="text-slate-500 font-medium">You do not have permission to access the Admin Panel.</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-pink-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-pink-500/20 uppercase tracking-widest text-xs"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-pink-500 rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-pink-500/30">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter italic uppercase">Admin <span className="text-pink-500">Panel</span></h2>
            <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Command Center • {new Date().toLocaleDateString()}</p>
            {profile?.role === 'ceo' && (
              <button 
                onClick={handleMigrateUserIds}
                className="mt-2 text-[10px] bg-pink-500/10 text-pink-500 px-3 py-1 rounded-full font-black tracking-widest hover:bg-pink-500 hover:text-white transition-all"
              >
                Migrate All IDs to 8-Digits
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={cn(
            "flex items-center gap-3 px-6 py-4 rounded-[1.5rem] border w-full md:w-80 transition-all focus-within:border-pink-500",
            theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
          )}>
            <Search className="w-5 h-5 text-slate-500" />
            <input 
              type="text"
              placeholder="Search everything..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold w-full"
            />
          </div>
          <button 
            onClick={() => {
              setEditingMission(null);
              setNewMission({ title: '', description: '', reward: '', category: '', link: '' });
              setShowAddMission(true);
            }}
            className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-2xl shadow-pink-500/20 group shrink-0"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            New Mission
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={cn(
            "rounded-[2.5rem] p-6 border flex flex-col items-center text-center space-y-3 transition-all hover:scale-[1.02]",
            theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
          )}>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 font-black uppercase tracking-widest text-[9px]">{stat.label}</p>
              <h4 className="text-3xl font-black tracking-tighter italic">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Main Tabs */}
      <div className="space-y-6">
        <div className={cn(
          "flex p-1.5 rounded-[2.5rem] border w-full overflow-x-auto custom-scrollbar no-scrollbar-firefox",
          theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
        )}>
          <div className="flex min-w-max gap-1">
            {(['submissions', 'withdrawals', 'deposits', 'activations', 'socialsells', 'missions', 'users', 'giftcodes', 'levels', 'addnumber', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-8 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 relative whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-pink-500 text-white shadow-xl shadow-pink-500/30" 
                    : "text-slate-500 hover:text-pink-500"
                )}
              >
                {tab === 'submissions' && <ListTodo className="w-4 h-4" />}
                {tab === 'withdrawals' && <Landmark className="w-4 h-4" />}
                {tab === 'deposits' && <ArrowDownCircle className="w-4 h-4" />}
                {tab === 'activations' && <ShieldCheck className="w-4 h-4" />}
                {tab === 'socialsells' && <Share2 className="w-4 h-4" />}
                {tab === 'missions' && <Eye className="w-4 h-4" />}
                {tab === 'users' && <UsersIcon className="w-4 h-4" />}
                {tab === 'giftcodes' && <Gift className="w-4 h-4" />}
                {tab === 'levels' && <Award className="w-4 h-4" />}
                {tab === 'addnumber' && <Smartphone className="w-4 h-4" />}
                {tab === 'settings' && <SettingsIcon className="w-4 h-4" />}
                {tab === 'addnumber' ? 'Add Number' : tab}
                {searchQuery && tab !== 'settings' && tab !== 'addnumber' && tab !== 'giftcodes' && tab !== 'levels' ? (
                  <span className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-black",
                    activeTab === tab ? "bg-white text-pink-500" : "bg-pink-500 text-white"
                  )}>
                    {tab === 'submissions' && subMatches}
                    {tab === 'withdrawals' && withMatches}
                    {tab === 'deposits' && depMatches}
                    {tab === 'activations' && actMatches}
                    {tab === 'socialsells' && sellMatches}
                    {tab === 'missions' && missionMatches}
                    {tab === 'users' && userMatches}
                  </span>
                ) : (
                  <>
                    {tab === 'submissions' && submissions.filter(s => s.status === 'pending').length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black">
                        {submissions.filter(s => s.status === 'pending').length}
                      </span>
                    )}
                    {tab === 'withdrawals' && withdrawals.filter(w => w.status === 'pending').length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black">
                        {withdrawals.filter(w => w.status === 'pending').length}
                      </span>
                    )}
                    {tab === 'activations' && activationRequests.filter(a => a.status === 'pending').length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black">
                        {activationRequests.filter(a => a.status === 'pending').length}
                      </span>
                    )}
                    {tab === 'deposits' && deposits.filter(d => d.status === 'pending').length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-black">
                        {deposits.filter(d => d.status === 'pending').length}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'submissions' && (
            <div className="space-y-6">
              <div className="flex gap-2">
                {(['pending', 'approved', 'rejected'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setSubFilter(f)}
                    className={cn(
                      "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                      subFilter === f 
                        ? "bg-pink-500 border-pink-500 text-white" 
                        : theme === 'dark' ? "border-[#303456] text-slate-500 hover:border-pink-500" : "border-slate-200 text-slate-400 hover:border-pink-500"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="grid gap-6">
                {filteredSubmissions.length === 0 && (
                  <div className={cn(
                    "text-center py-24 rounded-[3rem] border border-dashed text-sm font-black uppercase tracking-widest italic",
                    theme === 'dark' ? "bg-[#1a1c2e] border-[#303456] text-slate-500" : "bg-white border-slate-200 text-slate-400"
                  )}>
                    No {subFilter} submissions found.
                  </div>
                )}
                {filteredSubmissions.map(sub => (
                  <div key={sub.id} className={cn(
                    "rounded-[3rem] p-10 flex flex-col lg:flex-row justify-between gap-10 border transition-all hover:shadow-2xl hover:shadow-pink-500/5",
                    theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
                  )}>
                    <div className="space-y-8 flex-1">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-pink-500/10 rounded-[1.25rem] flex items-center justify-center border border-pink-500/20">
                          <UsersIcon className="w-7 h-7 text-pink-500" />
                        </div>
                        <div>
                          <div className="font-black text-2xl tracking-tight italic">{sub.userName || 'Anonymous'}</div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Mission: {sub.missionTitle}</div>
                              <div className="text-[10px] bg-pink-500/10 text-pink-500 px-2 py-0.5 rounded-full font-black tracking-widest">ID: {sub.userSequentialId || 'N/A'}</div>
                            </div>
                            {(() => {
                              const user = users.find(u => u.uid === sub.userId);
                              const referrer = user?.referredBy ? users.find(ref => ref.uid === user.referredBy || ref.userId === user.referredBy) : null;
                              return referrer ? (
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  Referred by: {referrer.userName} ({referrer.userId})
                                </div>
                              ) : user?.referredBy ? (
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  Referred by: {user.referredBy}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "p-8 rounded-[2rem] border relative group",
                        theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                      )}>
                        <div className="absolute -top-3 left-6 px-3 bg-inherit border border-inherit rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">Proof of Work</div>
                        {isUrl(sub.proof) ? (
                          <div className="space-y-4">
                            <a 
                              href={sub.proof} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-pink-500 font-bold flex items-center gap-2 hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Submission Link
                            </a>
                            {sub.proof.match(/\.(jpeg|jpg|gif|png|webp)$/i) || sub.proof.includes('firebasestorage.googleapis.com') ? (
                              <div className="relative w-full max-w-sm aspect-video rounded-2xl overflow-hidden border border-slate-200/20">
                                <img 
                                  src={sub.proof} 
                                  alt="Submission Proof" 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <p className={cn(
                            "text-sm font-medium leading-relaxed whitespace-pre-wrap",
                            theme === 'dark' ? "text-slate-300" : "text-slate-600"
                          )}>{sub.proof}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> {new Date(sub.submittedAt).toLocaleString()}</span>
                        <span className="flex items-center gap-2 text-emerald-500"><TrendingUp className="w-3 h-3" /> Reward: ${sub.reward}</span>
                      </div>
                    </div>
                    {sub.status === 'pending' && (
                      <div className="flex flex-row lg:flex-col gap-4 justify-center flex-wrap">
                        <button 
                          onClick={() => handleApproveSubmission(sub)}
                          className="flex-1 lg:flex-none bg-emerald-500 hover:bg-emerald-600 text-white p-6 rounded-[1.5rem] transition-all active:scale-95 shadow-xl shadow-emerald-500/20 flex items-center justify-center"
                        >
                          <Check className="w-8 h-8" />
                        </button>
                        <button 
                          onClick={() => handleRejectSubmission(sub.id)}
                          className="flex-1 lg:flex-none bg-rose-500 hover:bg-rose-600 text-white p-6 rounded-[1.5rem] transition-all active:scale-95 shadow-xl shadow-rose-500/20 flex items-center justify-center"
                        >
                          <X className="w-8 h-8" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="space-y-6">
              <div className="flex gap-2">
                {(['pending', 'completed', 'rejected'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setWithFilter(f)}
                    className={cn(
                      "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                      withFilter === f 
                        ? "bg-pink-500 border-pink-500 text-white" 
                        : theme === 'dark' ? "border-[#303456] text-slate-500 hover:border-pink-500" : "border-slate-200 text-slate-400 hover:border-pink-500"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="grid gap-6">
                {filteredWithdrawals.length === 0 && (
                  <div className={cn(
                    "text-center py-24 rounded-[3rem] border border-dashed text-sm font-black uppercase tracking-widest italic",
                    theme === 'dark' ? "bg-[#1a1c2e] border-[#303456] text-slate-500" : "bg-white border-slate-200 text-slate-400"
                  )}>
                    No {withFilter} withdrawals found.
                  </div>
                )}
                {filteredWithdrawals.map(w => (
                  <div key={w.id} className={cn(
                    "rounded-[3rem] p-10 flex flex-col sm:flex-row justify-between items-center gap-10 border transition-all hover:shadow-2xl hover:shadow-pink-500/5",
                    theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
                  )}>
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-rose-500/10 rounded-[1.25rem] flex items-center justify-center border border-rose-500/20">
                          <Landmark className="w-7 h-7 text-rose-500" />
                        </div>
                        <div>
                          <div className="text-4xl font-black text-rose-500 tracking-tighter italic">${w.amount.toFixed(2)}</div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Request by {w.userName || 'Anonymous'}</div>
                              <div className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full font-black tracking-widest">ID: {w.userSequentialId || 'N/A'}</div>
                            </div>
                            {(() => {
                              const user = users.find(u => u.uid === w.userId);
                              const referrer = user?.referredBy ? users.find(ref => ref.uid === user.referredBy || ref.userId === user.referredBy) : null;
                              return referrer ? (
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  Referred by: {referrer.userName} ({referrer.userId})
                                </div>
                              ) : user?.referredBy ? (
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  Referred by: {user.referredBy}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <span className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] block px-2">Payment Method & Number</span> 
                        <div className={cn(
                          "font-mono p-6 rounded-[1.5rem] border text-sm font-bold flex items-center justify-between",
                          theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                        )}>
                          <span className="uppercase text-pink-500">{w.method}</span>
                          <span className="tracking-widest">{w.paymentNumber}</span>
                        </div>
                      </div>
                    </div>
                    {w.status === 'pending' && (
                      <div className="flex flex-row lg:flex-col gap-4 w-full lg:w-auto flex-wrap">
                        <button 
                          onClick={() => handleCompleteWithdrawal(w)}
                          className="flex-1 lg:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                        >
                          Complete
                        </button>
                        <button 
                          onClick={() => handleRejectWithdrawal(w)}
                          className="flex-1 lg:flex-none bg-rose-500 hover:bg-rose-600 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2"
                        >
                          <X className="w-5 h-5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'deposits' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
                {(['pending', 'approved', 'rejected'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setDepFilter(f)}
                    className={cn(
                      "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      depFilter === f 
                        ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" 
                        : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20"
                    )}
                  >
                    {f} ({deposits.filter(d => d.status === f).length})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6">
                {deposits.filter(d => d.status === depFilter).map((d) => (
                  <div key={d.id} className={cn(
                    "rounded-[2.5rem] p-8 border flex flex-col md:flex-row items-center justify-between gap-8 transition-all hover:scale-[1.01]",
                    theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
                  )}>
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center">
                        <ArrowDownCircle className="w-8 h-8 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight italic">{d.userName}</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID: {d.userSequentialId}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400">{new Date(d.submittedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-10">
                      <div className="text-center">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Method</div>
                        <div className="text-sm font-black uppercase tracking-widest text-blue-500">{d.method}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Number</div>
                        <div className="text-sm font-black tracking-widest">{d.paymentNumber}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Transaction ID</div>
                        <div className="text-sm font-black tracking-widest text-blue-500">{d.transactionId}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Amount</div>
                        <div className="text-xl font-black text-blue-500 tracking-tighter italic">BDT {d.amount}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {d.screenshot && (
                        <a 
                          href={d.screenshot} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-4 rounded-2xl bg-slate-500/10 text-slate-500 hover:bg-slate-500 hover:text-white transition-all"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                      )}
                      {d.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveDeposit(d)}
                            className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleRejectDeposit(d.id)}
                            className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activations' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-2">
                  {(['pending', 'approved', 'rejected'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setActFilter(f)}
                      className={cn(
                        "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                        actFilter === f 
                          ? "bg-pink-500 border-pink-500 text-white" 
                          : theme === 'dark' ? "border-[#303456] text-slate-500 hover:border-pink-500" : "border-slate-200 text-slate-400 hover:border-pink-500"
                      )}
                    >
                      {f} ({activationRequests.filter(a => a.status === f).length})
                    </button>
                  ))}
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Email or ID..."
                    className={cn(
                      "w-full pl-12 pr-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-pink-500/20 transition-all text-sm font-bold",
                      theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-6">
                {filteredActivations.length === 0 && (
                  <div className={cn(
                    "text-center py-24 rounded-[3rem] border border-dashed text-sm font-black uppercase tracking-widest italic",
                    theme === 'dark' ? "bg-[#1a1c2e] border-[#303456] text-slate-500" : "bg-white border-slate-200 text-slate-400"
                  )}>
                    No {actFilter} activation requests found.
                  </div>
                )}
                {filteredActivations.map(act => (
                  <div key={act.id} className={cn(
                    "rounded-[3rem] p-10 flex flex-col lg:flex-row justify-between gap-10 border transition-all hover:shadow-2xl hover:shadow-pink-500/5",
                    theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
                  )}>
                    <div className="space-y-8 flex-1">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-pink-500/10 rounded-[1.25rem] flex items-center justify-center border border-pink-500/20">
                          <ShieldCheck className="w-7 h-7 text-pink-500" />
                        </div>
                        <div>
                          <div className="font-black text-2xl tracking-tight italic">{act.userName || 'Anonymous'}</div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">{act.userEmail}</div>
                              <div className="text-[10px] bg-pink-500/10 text-pink-500 px-2 py-0.5 rounded-full font-black tracking-widest">ID: {act.userSequentialId || 'N/A'}</div>
                            </div>
                            {(() => {
                              const user = users.find(u => u.uid === act.userId);
                              const referrer = user?.referredBy ? users.find(ref => ref.uid === user.referredBy || ref.userId === user.referredBy) : null;
                              return referrer ? (
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  Referred by: {referrer.userName} ({referrer.userId})
                                </div>
                              ) : user?.referredBy ? (
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  Referred by: {user.referredBy}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={cn(
                          "p-4 rounded-2xl border",
                          theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                        )}>
                          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Method</div>
                          <div className="text-sm font-bold">{act.method}</div>
                        </div>
                        <div className={cn(
                          "p-4 rounded-2xl border",
                          theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                        )}>
                          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Sender Number</div>
                          <div className="text-sm font-bold">{act.senderNumber}</div>
                        </div>
                        <div className={cn(
                          "p-4 rounded-2xl border",
                          theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                        )}>
                          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Number</div>
                          <div className="text-sm font-bold">{act.paymentNumber}</div>
                        </div>
                        <div className={cn(
                          "p-4 rounded-2xl border",
                          theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                        )}>
                          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Amount</div>
                          <div className="text-sm font-bold text-pink-500">{act.amount} Taka</div>
                        </div>
                      </div>

                      <div className={cn(
                        "p-6 rounded-2xl border",
                        theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                      )}>
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Transaction ID</div>
                        <div className="text-sm font-mono font-bold break-all">{act.transactionId}</div>
                      </div>

                      {act.screenshot && (
                        <div className="space-y-4">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2">Screenshot</span>
                          <div className="space-y-4">
                            <a 
                              href={act.screenshot} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-pink-500 font-bold text-xs hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" /> View Screenshot
                            </a>
                            <div className="relative w-full max-w-sm aspect-video rounded-2xl overflow-hidden border border-slate-200/20">
                              <img 
                                src={act.screenshot} 
                                alt="Activation Screenshot" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> {new Date(act.submittedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {act.status === 'pending' && (
                      <div className="flex lg:flex-col gap-4 justify-center">
                        <button 
                          onClick={() => handleApproveActivation(act)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white p-6 rounded-[1.5rem] transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                          title="Approve Activation"
                        >
                          <Check className="w-8 h-8" />
                        </button>
                        <button 
                          onClick={() => handleRejectActivation(act.id)}
                          className="bg-rose-500 hover:bg-rose-600 text-white p-6 rounded-[1.5rem] transition-all active:scale-95 shadow-xl shadow-rose-500/20"
                          title="Reject Activation"
                        >
                          <X className="w-8 h-8" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'giftcodes' && (
            <div className="space-y-10">
              <div className={cn(
                "rounded-[3rem] p-10 border space-y-8",
                theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
              )}>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tighter italic uppercase">Create <span className="text-pink-500">Gift Code</span></h3>
                  <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Generate new codes for agents</p>
                </div>
                <form onSubmit={handleCreateGiftCode} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Code</label>
                    <input 
                      value={newGiftCode.code}
                      onChange={e => setNewGiftCode({...newGiftCode, code: e.target.value})}
                      placeholder="WELCOME50"
                      className={cn(
                        "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                        theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                      )}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Amount ($)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={newGiftCode.amount}
                      onChange={e => setNewGiftCode({...newGiftCode, amount: e.target.value})}
                      placeholder="1.00"
                      className={cn(
                        "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                        theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                      )}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Max Uses</label>
                    <input 
                      type="number"
                      value={newGiftCode.maxUses}
                      onChange={e => setNewGiftCode({...newGiftCode, maxUses: e.target.value})}
                      placeholder="100"
                      className={cn(
                        "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                        theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                      )}
                      required
                    />
                  </div>
                  <button type="submit" className="bg-pink-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-pink-500/20 uppercase tracking-widest text-xs">Create Code</button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {giftCodes.map(gc => (
                  <div key={gc.id} className={cn(
                    "rounded-[2.5rem] p-8 border space-y-6 transition-all hover:scale-[1.02]",
                    theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
                  )}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-2xl font-black tracking-tighter italic text-pink-500">{gc.code}</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount: ${gc.amount}</p>
                      </div>
                      <button onClick={() => handleDeleteGiftCode(gc.id!)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span>Usage</span>
                        <span>{gc.usedCount} / {gc.maxUses}</span>
                      </div>
                      <div className="h-2 bg-slate-500/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-pink-500 transition-all duration-500" 
                          style={{ width: `${(gc.usedCount / gc.maxUses) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'levels' && (
            <div className="space-y-10">
              <div className={cn(
                "rounded-[3rem] p-10 border space-y-8",
                theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
              )}>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tighter italic uppercase">Configure <span className="text-pink-500">Levels</span></h3>
                  <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Set referral requirements for agent ranks</p>
                </div>
                <form onSubmit={handleSaveLevel} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Level #</label>
                    <input 
                      type="number"
                      value={newLevel.level}
                      onChange={e => setNewLevel({...newLevel, level: e.target.value})}
                      placeholder="1"
                      className={cn(
                        "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                        theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                      )}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Rank Name</label>
                    <input 
                      value={newLevel.name}
                      onChange={e => setNewLevel({...newLevel, name: e.target.value})}
                      placeholder="Bronze"
                      className={cn(
                        "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                        theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                      )}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Min Referrals</label>
                    <input 
                      type="number"
                      value={newLevel.minReferrals}
                      onChange={e => setNewLevel({...newLevel, minReferrals: e.target.value})}
                      placeholder="5"
                      className={cn(
                        "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                        theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                      )}
                      required
                    />
                  </div>
                  <button type="submit" className="bg-pink-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-pink-500/20 uppercase tracking-widest text-xs">Save Level</button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {levelConfigs.map(lc => (
                  <div key={lc.level} className={cn(
                    "rounded-[2.5rem] p-8 border flex items-center justify-between transition-all hover:scale-[1.02]",
                    theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center text-white font-black italic shadow-lg shadow-pink-500/20">
                        {lc.level}
                      </div>
                      <div>
                        <h4 className="font-black text-lg tracking-tight italic">{lc.name}</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lc.minReferrals} Referrals Required</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setNewLevel({ level: lc.level.toString(), name: lc.name, minReferrals: lc.minReferrals.toString() })}
                        className="p-2 text-slate-400 hover:text-pink-500 transition-colors"
                        title="Edit Level"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteLevel(lc.level)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete Level"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'addnumber' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Activation Payment Numbers */}
                <div className={cn(
                  "rounded-[3rem] p-10 border space-y-10",
                  theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
                )}>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tighter italic uppercase">Activation <span className="text-pink-500">Numbers</span></h3>
                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Numbers where agents send money for activation</p>
                  </div>

                  <form onSubmit={handleUpdatePaymentSettings} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">bKash Number</label>
                        <input 
                          value={paymentSettings.bKash}
                          onChange={e => setPaymentSettings({...paymentSettings, bKash: e.target.value})}
                          placeholder="017XXXXXXXX"
                          className={cn(
                            "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                            theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Nagad Number</label>
                        <input 
                          value={paymentSettings.Nagad}
                          onChange={e => setPaymentSettings({...paymentSettings, Nagad: e.target.value})}
                          placeholder="017XXXXXXXX"
                          className={cn(
                            "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                            theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Rocket Number</label>
                        <input 
                          value={paymentSettings.Rocket}
                          onChange={e => setPaymentSettings({...paymentSettings, Rocket: e.target.value})}
                          placeholder="017XXXXXXXX"
                          className={cn(
                            "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                            theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Activation Fee (Taka)</label>
                        <input 
                          type="number"
                          value={paymentSettings.activationFee}
                          onChange={e => setPaymentSettings({...paymentSettings, activationFee: Number(e.target.value)})}
                          className={cn(
                            "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                            theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                          )}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-pink-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-pink-500/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Activation Settings
                    </button>
                  </form>
                </div>

                {/* Deposit Payment Numbers */}
                <div className={cn(
                  "rounded-[3rem] p-10 border space-y-10",
                  theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
                )}>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tighter italic uppercase">Deposit <span className="text-pink-500">Numbers</span></h3>
                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Numbers where agents send money for deposits</p>
                  </div>

                  <form onSubmit={handleUpdateDepositSettings} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">bKash (Deposit)</label>
                        <input 
                          value={depositSettings.bkash}
                          onChange={e => setDepositSettings({...depositSettings, bkash: e.target.value})}
                          placeholder="017XXXXXXXX"
                          className={cn(
                            "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                            theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Nagad (Deposit)</label>
                        <input 
                          value={depositSettings.nagad}
                          onChange={e => setDepositSettings({...depositSettings, nagad: e.target.value})}
                          placeholder="017XXXXXXXX"
                          className={cn(
                            "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                            theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Rocket (Deposit)</label>
                        <input 
                          value={depositSettings.rocket}
                          onChange={e => setDepositSettings({...depositSettings, rocket: e.target.value})}
                          placeholder="017XXXXXXXX"
                          className={cn(
                            "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                            theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                          )}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-pink-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-pink-500/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Deposit Settings
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-10 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Withdrawal Limits */}
                <div className={cn(
                  "rounded-[3rem] p-10 border space-y-10",
                  theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
                )}>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tighter italic uppercase">Withdrawal <span className="text-pink-500">Limits</span></h3>
                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Set minimum and maximum payout amounts</p>
                  </div>

                  <form onSubmit={handleUpdateWithdrawSettings} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Min Withdrawal (BDT)</label>
                        <input 
                          type="number"
                          value={withdrawSettings.minWithdraw}
                          onChange={e => setWithdrawSettings({...withdrawSettings, minWithdraw: Number(e.target.value)})}
                          className={cn(
                            "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                            theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Max Withdrawal (BDT)</label>
                        <input 
                          type="number"
                          value={withdrawSettings.maxWithdraw}
                          onChange={e => setWithdrawSettings({...withdrawSettings, maxWithdraw: Number(e.target.value)})}
                          className={cn(
                            "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                            theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                          )}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-pink-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-pink-500/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Withdrawal Limits
                    </button>
                  </form>
                </div>
              </div>

              {/* Dynamic Site Settings */}
              <div className={cn(
                "rounded-[3rem] p-10 border space-y-10",
                theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
              )}>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tighter italic uppercase">Site <span className="text-pink-500">Content</span></h3>
                  <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Configure links and text content</p>
                </div>

                <form onSubmit={handleUpdateDynamicSettings} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Telegram Links */}
                    <div className="space-y-6">
                      <h4 className="text-sm font-black uppercase tracking-widest text-pink-500 italic">Telegram Links</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Telegram Group</label>
                          <input 
                            value={dynamicSettings.telegramGroup}
                            onChange={e => setDynamicSettings({...dynamicSettings, telegramGroup: e.target.value})}
                            placeholder="https://t.me/..."
                            className={cn(
                              "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                              theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Telegram Channel</label>
                          <input 
                            value={dynamicSettings.telegramChannel}
                            onChange={e => setDynamicSettings({...dynamicSettings, telegramChannel: e.target.value})}
                            placeholder="https://t.me/..."
                            className={cn(
                              "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                              theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Private Support</label>
                          <input 
                            value={dynamicSettings.telegramSupport}
                            onChange={e => setDynamicSettings({...dynamicSettings, telegramSupport: e.target.value})}
                            placeholder="https://t.me/..."
                            className={cn(
                              "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                              theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Meeting Link</label>
                          <input 
                            value={dynamicSettings.meetingGroup}
                            onChange={e => setDynamicSettings({...dynamicSettings, meetingGroup: e.target.value})}
                            placeholder="https://t.me/..."
                            className={cn(
                              "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                              theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Site Content Settings */}
                    <div className="space-y-6">
                      <h4 className="text-sm font-black uppercase tracking-widest text-pink-500 italic">Site Content</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Welcome Title</label>
                          <input 
                            value={dynamicSettings.welcomeTitle}
                            onChange={e => setDynamicSettings({...dynamicSettings, welcomeTitle: e.target.value})}
                            className={cn(
                              "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                              theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Welcome Text</label>
                          <textarea 
                            value={dynamicSettings.welcomeText}
                            onChange={e => setDynamicSettings({...dynamicSettings, welcomeText: e.target.value})}
                            rows={4}
                            className={cn(
                              "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500 resize-none",
                              theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Author Name</label>
                          <input 
                            value={dynamicSettings.quoteAuthor}
                            onChange={e => setDynamicSettings({...dynamicSettings, quoteAuthor: e.target.value})}
                            className={cn(
                              "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                              theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Footer Quote</label>
                          <textarea 
                            value={dynamicSettings.footerQuote}
                            onChange={e => setDynamicSettings({...dynamicSettings, footerQuote: e.target.value})}
                            rows={3}
                            className={cn(
                              "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500 resize-none",
                              theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Footer Copyright Text</label>
                          <input 
                            value={dynamicSettings.footerText}
                            onChange={e => setDynamicSettings({...dynamicSettings, footerText: e.target.value})}
                            className={cn(
                              "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                              theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    {profile?.role === 'ceo' && (
                      <div className="space-y-6 pt-6 border-t border-rose-500/20">
                        <h4 className="text-sm font-black uppercase tracking-widest text-rose-500 italic">Danger Zone</h4>
                        <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
                              <ShieldAlert className="w-6 h-6 text-rose-500" />
                            </div>
                            <div>
                              <h5 className="text-sm font-black uppercase tracking-tight italic">Deactivate All Users</h5>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reset all account statuses to inactive</p>
                            </div>
                          </div>
                          <p className="text-xs font-medium text-slate-500">
                            This will set the status of all users (except CEO) to 'inactive'. Users will need to pay the activation fee again to become active.
                          </p>
                          <button 
                            type="button"
                            onClick={handleDeactivateAll}
                            disabled={isSubmitting}
                            className="w-full bg-rose-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-rose-500/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors disabled:opacity-50"
                          >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                            Deactivate All Users
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-pink-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-pink-500/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Site Content
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'socialsells' && (
            <div className="space-y-6">
              <div className="flex gap-2">
                {(['pending', 'approved', 'rejected'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setSellFilter(f)}
                    className={cn(
                      "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                      sellFilter === f 
                        ? "bg-pink-500 border-pink-500 text-white" 
                        : theme === 'dark' ? "border-[#303456] text-slate-500 hover:border-pink-500" : "border-slate-200 text-slate-400 hover:border-pink-500"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="grid gap-6">
                {socialSells.filter(s => s.status === sellFilter && (
                  s.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.platform?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.email?.toLowerCase().includes(searchQuery.toLowerCase())
                )).length === 0 && (
                  <div className={cn(
                    "text-center py-24 rounded-[3rem] border border-dashed text-sm font-black uppercase tracking-widest italic",
                    theme === 'dark' ? "bg-[#1a1c2e] border-[#303456] text-slate-500" : "bg-white border-slate-200 text-slate-400"
                  )}>
                    No {sellFilter} sell requests found.
                  </div>
                )}
                {socialSells.filter(s => s.status === sellFilter && (
                  s.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.platform?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.email?.toLowerCase().includes(searchQuery.toLowerCase())
                )).map(sell => (
                  <div key={sell.id} className={cn(
                    "rounded-[3rem] p-10 flex flex-col lg:flex-row justify-between gap-10 border transition-all hover:shadow-2xl hover:shadow-pink-500/5",
                    theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
                  )}>
                    <div className="space-y-8 flex-1">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-pink-500/10 rounded-[1.25rem] flex items-center justify-center border border-pink-500/20">
                          <Share2 className="w-7 h-7 text-pink-500" />
                        </div>
                        <div>
                          <div className="font-black text-2xl tracking-tight italic">{sell.userName || 'Anonymous'}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Platform: {sell.platform} • ID: {sell.userSequentialId}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={cn(
                          "p-6 rounded-[2rem] border",
                          theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                        )}>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Account Details</div>
                          <div className="space-y-2">
                            {sell.idName && (
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-bold">ID Name: <span className="text-pink-500">{sell.idName}</span></div>
                                <button onClick={() => { navigator.clipboard.writeText(sell.idName!); alert('ID Name copied!'); }} className="p-1 hover:bg-pink-500/10 rounded text-pink-500"><Copy className="w-3 h-3" /></button>
                              </div>
                            )}
                            {sell.username && (
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-bold">Username: <span className="text-pink-500">{sell.username}</span></div>
                                <button onClick={() => { navigator.clipboard.writeText(sell.username!); alert('Username copied!'); }} className="p-1 hover:bg-pink-500/10 rounded text-pink-500"><Copy className="w-3 h-3" /></button>
                              </div>
                            )}
                            {sell.email && (
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-bold">Email/Gmail: <span className="text-pink-500">{sell.email}</span></div>
                                <button onClick={() => { navigator.clipboard.writeText(sell.email!); alert('Email copied!'); }} className="p-1 hover:bg-pink-500/10 rounded text-pink-500"><Copy className="w-3 h-3" /></button>
                              </div>
                            )}
                            {sell.gmail && (
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-bold">Gmail: <span className="text-pink-500">{sell.gmail}</span></div>
                                <button onClick={() => { navigator.clipboard.writeText(sell.gmail!); alert('Gmail copied!'); }} className="p-1 hover:bg-pink-500/10 rounded text-pink-500"><Copy className="w-3 h-3" /></button>
                              </div>
                            )}
                            {sell.password && (
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-bold">Password: <span className="text-pink-500">{sell.password}</span></div>
                                <button onClick={() => { navigator.clipboard.writeText(sell.password!); alert('Password copied!'); }} className="p-1 hover:bg-pink-500/10 rounded text-pink-500"><Copy className="w-3 h-3" /></button>
                              </div>
                            )}
                            {sell.twoFactor && (
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-bold">2FA: <span className="text-pink-500">{sell.twoFactor}</span></div>
                                <button onClick={() => { navigator.clipboard.writeText(sell.twoFactor!); alert('2FA copied!'); }} className="p-1 hover:bg-pink-500/10 rounded text-pink-500"><Copy className="w-3 h-3" /></button>
                              </div>
                            )}
                          </div>
                        </div>

                        {sell.screenshot && (
                          <div className={cn(
                            "p-6 rounded-[2rem] border",
                            theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                          )}>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Screenshot</div>
                            <a href={sell.screenshot} target="_blank" rel="noopener noreferrer" className="block relative aspect-video rounded-xl overflow-hidden border border-slate-200/20">
                              <img src={sell.screenshot} alt="Screenshot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ExternalLink className="w-6 h-6 text-white" />
                              </div>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {sell.status === 'pending' && (
                      <div className="flex flex-row lg:flex-col gap-3 justify-center">
                        <button 
                          onClick={() => handleApproveSocialSell(sell)}
                          className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button 
                          onClick={() => handleRejectSocialSell(sell.id)}
                          className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'missions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMissions.map(m => (
                <div key={m.id} className={cn(
                  "rounded-[3rem] p-10 space-y-8 border shadow-xl flex flex-col transition-all hover:scale-[1.02]",
                  theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
                )}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-black text-2xl tracking-tight leading-tight italic">{m.title}</h3>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.category}</span>
                    </div>
                    <span className="text-pink-500 font-black text-3xl tracking-tighter italic">${m.reward}</span>
                  </div>
                  <p className={cn(
                    "text-sm font-medium line-clamp-4 leading-relaxed flex-1",
                    theme === 'dark' ? "text-slate-400" : "text-slate-600"
                  )}>{m.description}</p>
                  <div className={cn(
                    "flex justify-between items-center pt-8 border-t",
                    theme === 'dark' ? "border-[#303456]" : "border-slate-100"
                  )}>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingMission(m);
                          setNewMission({ title: m.title, description: m.description, reward: m.reward.toString(), category: m.category, link: m.link || '' });
                          setShowAddMission(true);
                        }}
                        className="p-2 text-slate-400 hover:text-pink-500 transition-colors"
                        title="Edit Mission"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMission(m.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete Mission"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={async () => {
                        await updateDoc(doc(db, 'missions', m.id), { 
                          status: m.status === 'active' ? 'inactive' : 'active' 
                        });
                      }}
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-2",
                        m.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                      )}
                    >
                      {m.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {m.status}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">
                Showing {filteredUsers.length} of {users.length} agents
              </div>

              <div className="grid gap-4">
                {filteredUsers.map(u => (
                  <div key={u.uid} className={cn(
                    "rounded-[2rem] p-6 border flex flex-col sm:flex-row justify-between items-center gap-6 transition-all",
                    theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
                  )}>
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl italic shadow-lg",
                        u.status === 'active' ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20"
                      )}>
                        {u.userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-black text-xl tracking-tight italic">
                          {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : u.userName || 'Anonymous'}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="text-[10px] text-slate-500 font-bold tracking-widest flex items-center gap-1">
                              {u.userName} • {u.email}
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(u.email || '');
                                  setMessage({ type: 'success', text: 'Email copied!' });
                                }}
                                className="hover:text-pink-500 transition-colors"
                                title="Copy Email"
                              >
                                <Copy className="w-2 h-2" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-[10px] bg-pink-500/10 text-pink-500 px-2 py-0.5 rounded-full font-black tracking-widest flex items-center gap-1">
                                ID: {u.userId || 'N/A'}
                                {u.userId && (
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(u.userId!);
                                      setMessage({ type: 'success', text: 'ID copied!' });
                                    }}
                                    className="hover:scale-110 transition-transform"
                                    title="Copy ID"
                                  >
                                    <Copy className="w-2 h-2" />
                                  </button>
                                )}
                              </div>
                              {profile?.role === 'ceo' && (
                                <button 
                                  onClick={() => {
                                    setEditingUser(u);
                                    setEditForm({
                                      userId: u.userId || '',
                                      role: u.role || 'user',
                                      balance: (u.balance || 0).toString(),
                                      status: u.status || 'active'
                                    });
                                  }}
                                  className="p-1 hover:bg-pink-500/10 rounded-md transition-colors"
                                  title="Edit User Details"
                                >
                                  <Edit3 className="w-3 h-3 text-pink-500" />
                                </button>
                              )}
                            </div>
                          </div>
                          {activationRequests.find(a => a.userId === u.uid && a.status === 'pending') && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Clock className="w-2 h-2" /> Pending Activation
                              </span>
                              <button 
                                onClick={() => {
                                  setActiveTab('activations');
                                  setActFilter('pending');
                                  setSearchQuery(u.userId || u.userName || '');
                                }}
                                className="text-[8px] font-black text-pink-500 hover:underline uppercase tracking-widest"
                              >
                                View Request
                              </button>
                            </div>
                          )}
                          {u.referredBy && (
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Referred by: {(() => {
                                const referrer = users.find(ref => ref.uid === u.referredBy || ref.userId === u.referredBy);
                                return referrer ? `${referrer.userName} (${referrer.userId})` : u.referredBy;
                              })()}
                            </div>
                          )}
                          <div className="text-[9px] font-black text-pink-400 uppercase tracking-widest mt-1">
                            Team Size: {u.referrals || 0} Active Agents • Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-10">
                      <div className="text-center group cursor-pointer" onClick={() => {
                        setEditingUser(u);
                        setEditForm({
                          userId: u.userId || '',
                          role: u.role || 'user',
                          balance: (u.balance || 0).toString(),
                          status: u.status || 'active'
                        });
                      }}>
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">Balance <Edit3 className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                        <div className="text-xl font-black text-pink-500 tracking-tighter italic">${(u.balance || 0).toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Role</div>
                        <button 
                          onClick={() => {
                            setEditingUser(u);
                            setEditForm({
                              userId: u.userId || '',
                              role: u.role || 'user',
                              balance: (u.balance || 0).toString(),
                              status: u.status || 'active'
                            });
                          }}
                          className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all hover:scale-105",
                            u.role === 'ceo' ? "bg-pink-500/10 text-pink-500 border border-pink-500/20" :
                            u.role === 'admin' ? "bg-purple-500/10 text-purple-500 border border-purple-500/20" : 
                            u.role === 'moderator' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                            "bg-slate-500/10 text-slate-500 border border-slate-500/10"
                          )}
                        >
                          {u.role || 'user'}
                        </button>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</div>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                          u.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        )}>
                          {u.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingUser(u);
                            setEditForm({
                              userId: u.userId || '',
                              role: u.role || 'user',
                              balance: (u.balance || 0).toString(),
                              status: u.status || 'active'
                            });
                          }}
                          className={cn(
                            "p-4 rounded-2xl transition-all active:scale-95",
                            u.status === 'active' ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white" : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                          )}
                          title={u.status === 'active' ? 'Deactivate User' : 'Activate User'}
                        >
                          {u.status === 'active' ? <Ban className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.uid, u.role)}
                          className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                          title="Delete User"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Balance Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className={cn(
            "w-full max-w-md rounded-[2.5rem] p-8 space-y-6 border animate-in fade-in zoom-in duration-300 my-auto",
            "max-h-[90vh] overflow-y-auto custom-scrollbar",
            theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
          )}>
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-xl font-black italic uppercase tracking-tight">Edit <span className="text-pink-500">User</span></h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{editingUser.userName}</p>
              </div>
              <button onClick={() => setEditingUser(null)}><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">User ID (8 Digits)</label>
                  <input 
                    type="text"
                    value={editForm.userId}
                    onChange={e => setEditForm({...editForm, userId: e.target.value})}
                    className={cn(
                      "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Balance ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={editForm.balance}
                    onChange={e => setEditForm({...editForm, balance: e.target.value})}
                    className={cn(
                      "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Role</label>
                  <select 
                    value={editForm.role}
                    onChange={e => setEditForm({...editForm, role: e.target.value as any})}
                    className={cn(
                      "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500 appearance-none",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                    )}
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                    <option value="ceo">CEO</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Status</label>
                  <select 
                    value={editForm.status}
                    onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                    className={cn(
                      "w-full rounded-2xl p-4 text-sm font-bold border outline-none focus:border-pink-500 appearance-none",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                    )}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-pink-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-pink-500/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Mission Modal */}
      {showAddMission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className={cn(
            "w-full max-w-xl rounded-[3.5rem] p-12 space-y-10 relative border animate-in fade-in zoom-in duration-300 my-auto",
            "max-h-[90vh] overflow-y-auto custom-scrollbar",
            theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200"
          )}>
            <button 
              onClick={() => {
                setShowAddMission(false);
                setEditingMission(null);
                setNewMission({ title: '', description: '', reward: '', category: '', link: '' });
              }}
              className="absolute top-10 right-10 text-slate-400 hover:text-pink-500 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="space-y-2">
              <h3 className="text-4xl font-black tracking-tighter italic uppercase">{editingMission ? 'Edit' : 'Create'} <span className="text-pink-500">Mission</span></h3>
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">{editingMission ? 'Update existing objective' : 'Define a new objective for agents'}</p>
            </div>

            <form onSubmit={handleAddMission} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Mission Title</label>
                <input 
                  value={newMission.title}
                  onChange={e => setNewMission({...newMission, title: e.target.value})}
                  placeholder="e.g. Subscribe to YouTube Channel"
                  className={cn(
                    "w-full rounded-[1.5rem] p-5 text-sm font-bold border transition-all outline-none",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456] focus:border-pink-500" : "bg-slate-50 border-slate-200 focus:border-pink-500"
                  )}
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Mission Link (Optional)</label>
                <input 
                  value={newMission.link || ''}
                  onChange={e => setNewMission({...newMission, link: e.target.value})}
                  placeholder="e.g. https://youtube.com/..."
                  className={cn(
                    "w-full rounded-[1.5rem] p-5 text-sm font-bold border transition-all outline-none",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456] focus:border-pink-500" : "bg-slate-50 border-slate-200 focus:border-pink-500"
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Reward ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={newMission.reward}
                    onChange={e => setNewMission({...newMission, reward: e.target.value})}
                    placeholder="0.00"
                    className={cn(
                      "w-full rounded-[1.5rem] p-5 text-sm font-bold border transition-all outline-none",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456] focus:border-pink-500" : "bg-slate-50 border-slate-200 focus:border-pink-500"
                    )}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Category</label>
                  <input 
                    value={newMission.category}
                    onChange={e => setNewMission({...newMission, category: e.target.value})}
                    placeholder="e.g. Social Media"
                    className={cn(
                      "w-full rounded-[1.5rem] p-5 text-sm font-bold border transition-all outline-none",
                      theme === 'dark' ? "bg-[#0a0b14] border-[#303456] focus:border-pink-500" : "bg-slate-50 border-slate-200 focus:border-pink-500"
                    )}
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Detailed Instructions</label>
                <textarea 
                  value={newMission.description}
                  onChange={e => setNewMission({...newMission, description: e.target.value})}
                  placeholder="Describe the steps the agent needs to take..."
                  className={cn(
                    "w-full rounded-[2rem] p-6 text-sm font-bold border transition-all outline-none min-h-[160px] resize-none",
                    theme === 'dark' ? "bg-[#0a0b14] border-[#303456] focus:border-pink-500" : "bg-slate-50 border-slate-200 focus:border-pink-500"
                  )}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-pink-500 text-white font-black py-6 rounded-[2rem] transition-all active:scale-95 shadow-2xl shadow-pink-500/30 uppercase tracking-widest text-sm"
              >
                {editingMission ? 'Update Mission' : 'Launch Mission'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Toast Message */}
      {message && (
        <div className={cn(
          "fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-[100]",
          message.type === 'success' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        )}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2 opacity-50 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
