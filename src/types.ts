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
  telegramEarnings?: number;
  facebookEarnings?: number;
  instagramEarnings?: number;
  gmailEarnings?: number;
  marketingEarnings?: number;
  adsEarnings?: number;
  totalWithdraw?: number;
  referrals?: number;
  role: 'admin' | 'user' | 'moderator' | 'ceo';
  status: 'active' | 'inactive' | 'pending';
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  // Specific Earnings
  telegramBalance?: number;
  facebookBalance?: number;
  instagramBalance?: number;
  gmailBalance?: number;
  salaryBalance?: number;
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
  paymentNumber: string;
  requestedAt?: string;
  submittedAt: string;
  rejectionReason?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName?: string;
  userSequentialId?: string;
  method: 'bkash' | 'nagad' | 'rocket';
  amount: number;
  transactionId: string;
  paymentNumber: string;
  screenshot: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
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
  rejectionReason?: string;
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

export interface SocialSellSubmission {
  id: string;
  userId: string;
  userName?: string;
  userSequentialId?: string;
  type: 'Facebook' | 'Instagram' | 'Telegram' | 'Gmail';
  platform?: string; // Alias for type used in some parts
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  // Facebook/Instagram/Gmail fields
  name?: string;
  idName?: string; // Alias for name
  username?: string;
  email?: string;
  password?: string;
  twoFactor?: string;
  screenshot?: string;
  price?: number;
}

export interface SocialSellSettings {
  facebookPrice: number;
  instagramPrice: number;
  telegramPrice: number;
  gmailPrice: number;
  facebookEnabled: boolean;
  instagramEnabled: boolean;
  telegramEnabled: boolean;
  gmailEnabled: boolean;
  facebookDisabledReason?: string;
  instagramDisabledReason?: string;
  telegramDisabledReason?: string;
  gmailDisabledReason?: string;
  adminPassword?: string;
  facebookPassword?: string;
  instagramPassword?: string;
  telegramPassword?: string;
  gmailPassword?: string;
  facebookVideoUrl?: string;
  instagramVideoUrl?: string;
  telegramVideoUrl?: string;
  gmailVideoUrl?: string;
  telegramSupport: string;
}

export interface DynamicSettings {
  telegramGroup: string;
  telegramChannel: string;
  telegramSupport: string;
  meetingGroup: string;
  welcomeTitle: string;
  welcomeText: string;
  footerQuote: string;
  quoteAuthor: string;
  footerText: string;
  youtubeVideoUrl?: string;
  backgroundImageUrl?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
