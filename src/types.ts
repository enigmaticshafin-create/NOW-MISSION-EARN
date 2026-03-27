export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  phoneNumber?: string;
  photoURL?: string;
  userId?: string; // Sequential ID like 00000001
  address?: string;
  level?: number;
  balance: number;
  totalEarned?: number;
  jobEarnings?: number;
  inviteEarnings?: number;
  salaryEarnings?: number;
  gmailEarnings?: number;
  telegramEarnings?: number;
  facebookEarnings?: number;
  instagramEarnings?: number;
  marketingEarnings?: number;
  adsEarnings?: number;
  totalWithdraw?: number;
  referrals?: number;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'pending';
  referralCode: string;
  referredBy?: string;
  createdAt: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: 'active' | 'inactive';
  category: string;
  link?: string;
  createdAt: string;
}

export interface MissionSubmission {
  id: string;
  missionId: string;
  userId: string;
  userName?: string;
  missionTitle?: string;
  userSequentialId?: string;
  status: 'pending' | 'approved' | 'rejected';
  proof: string;
  reward: number;
  submittedAt: string;
  adminNote?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userName?: string;
  userSequentialId?: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  method: string;
  requestedAt: string;
}

export interface ActivationRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userSequentialId?: string;
  method: 'bKash' | 'Nagad' | 'Rocket';
  senderNumber: string;
  paymentNumber: string;
  amount: number;
  transactionId: string;
  screenshot?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface PaymentSettings {
  bKash: string;
  Nagad: string;
  Rocket: string;
  activationFee: number;
}

export interface GiftCode {
  id: string;
  code: string;
  amount: number;
  maxUses: number;
  usageLimit?: number; // Alias for maxUses used in some parts of the app
  usedCount: number;
  status: 'active' | 'inactive';
  usedBy: string[]; // Array of user UIDs
  createdAt: string;
}

export interface LevelConfig {
  level: number;
  name: string;
  minReferrals: number;
}
