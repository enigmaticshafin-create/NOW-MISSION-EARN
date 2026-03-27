import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, addDoc, doc, getDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Mission, MissionSubmission } from '../types';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  X, 
  ChevronRight, 
  ShieldCheck, 
  Image as ImageIcon,
  Upload,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function MyJobs() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [proof, setProof] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const missionsQuery = query(collection(db, 'missions'), where('status', '==', 'active'));
        const missionsSnap = await getDocs(missionsQuery);
        const missionsData = missionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
        setMissions(missionsData);

        if (user) {
          const submissionsQuery = query(collection(db, 'missionSubmissions'), where('userId', '==', user.uid));
          const submissionsSnap = await getDocs(submissionsQuery);
          const submissionsData = submissionsSnap.docs.map(doc => doc.data() as MissionSubmission);
          setSubmissions(submissionsData);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getSubmissionStatus = (missionId: string) => {
    return submissions.find(s => s.missionId === missionId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleSubmitMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMission) return;

    setIsSubmitting(true);
    try {
      let proofUrl = '';
      if (proofFile) {
        const storageRef = ref(storage, `submissions/${user.uid}/${Date.now()}_${proofFile.name}`);
        await uploadBytes(storageRef, proofFile);
        proofUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'missionSubmissions'), {
        userId: user.uid,
        userName: profile?.userName || 'Anonymous',
        userSequentialId: profile?.userId || 'N/A',
        missionId: selectedMission.id,
        missionTitle: selectedMission.title,
        reward: selectedMission.reward,
        proof: proofUrl || proof.trim(),
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });

      setSubmissions(prev => [...prev, {
        userId: user.uid,
        userName: profile?.userName || 'Anonymous',
        userSequentialId: profile?.userId || 'N/A',
        missionId: selectedMission.id,
        missionTitle: selectedMission.title,
        reward: selectedMission.reward,
        proof: proofUrl || proof.trim(),
        status: 'pending',
        submittedAt: new Date().toISOString(),
      } as MissionSubmission]);

      setSelectedMission(null);
      setProof('');
      setProofFile(null);
      alert('Mission submitted successfully!');
    } catch (error) {
      console.error('Error submitting mission:', error);
      alert('Failed to submit mission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (profile?.status !== 'active') {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-6 px-4">
        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <ShieldCheck className="w-12 h-12 text-rose-500" />
        </div>
        <h2 className="text-3xl font-black tracking-tight italic uppercase">Account Inactive</h2>
        <p className={cn(
          "text-lg font-bold leading-relaxed",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          আপনার অ্যাকাউন্টটি একটিভ নয়! কাজ করার জন্য আপনার অ্যাকাউন্ট একটিভ করুন ধন্যবাদ!!
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-rose-500 text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-105 transition-all"
        >
          Go to Dashboard to Activate
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/20">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight italic uppercase">My Jobs</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Available tasks for you</p>
        </div>
      </div>

      <div className="grid gap-4">
        {missions.map((mission) => {
          const submission = getSubmissionStatus(mission.id);
          return (
            <div 
              key={mission.id}
              className={cn(
                "rounded-3xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all",
                theme === 'dark' ? "bg-[#1a1c2e] border-[#303456]" : "bg-white border-slate-200",
                submission?.status === 'approved' && "border-green-500/50 bg-green-500/5"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  theme === 'dark' ? "bg-[#252841]" : "bg-slate-100"
                )}>
                  <Briefcase className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <h4 className="font-black text-lg tracking-tight">{mission.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-pink-500 font-black text-sm">BDT {mission.reward.toFixed(2)}</span>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">• {mission.category || 'Task'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {submission ? (
                  <div className={cn(
                    "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2",
                    submission.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                    submission.status === 'approved' ? "bg-green-500/10 text-green-500" :
                    "bg-rose-500/10 text-rose-500"
                  )}>
                    {submission.status === 'pending' ? <Clock className="w-3 h-3" /> :
                     submission.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> :
                     <X className="w-3 h-3" />}
                    {submission.status}
                  </div>
                ) : (
                  <button 
                    onClick={() => setSelectedMission(mission)}
                    className="bg-pink-500 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-pink-500/20 hover:scale-105 transition-transform"
                  >
                    Start Mission
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {missions.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest">No active jobs available</p>
          </div>
        )}
      </div>

      {/* Mission Submission Modal */}
      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={cn(
            "w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300",
            theme === 'dark' ? "bg-[#1a1c2e] border border-[#303456]" : "bg-white"
          )}>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight italic uppercase">{selectedMission.title}</h3>
                  <p className="text-pink-500 font-black tracking-widest text-sm uppercase">Reward: BDT {selectedMission.reward.toFixed(2)}</p>
                </div>
                <button onClick={() => setSelectedMission(null)} className="p-2 hover:bg-slate-500/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className={cn(
                "p-4 rounded-2xl border text-sm font-medium leading-relaxed",
                theme === 'dark' ? "bg-[#0a0b14] border-[#303456] text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
              )}>
                {selectedMission.description}
              </div>

              {selectedMission.link && (
                <a 
                  href={selectedMission.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-500 font-black uppercase text-xs tracking-widest hover:bg-pink-500/20 transition-all"
                >
                  Visit Mission Link
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <form onSubmit={handleSubmitMission} className="space-y-6">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Submit Proof</label>
                  
                  <div className="relative group">
                    <input
                      type="file"
                      id="proof-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="proof-upload"
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 p-8 rounded-3xl border-2 border-dashed cursor-pointer transition-all",
                        theme === 'dark' 
                          ? "bg-[#0a0b14] border-[#303456] hover:border-pink-500/50" 
                          : "bg-slate-50 border-slate-200 hover:border-pink-500/50",
                        proofFile && "border-pink-500 bg-pink-500/5"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                        proofFile ? "bg-pink-500" : "bg-slate-500/20"
                      )}>
                        {proofFile ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Upload className="w-6 h-6 text-pink-500" />}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black uppercase tracking-widest">
                          {proofFile ? "Screenshot Selected" : "Upload Screenshot"}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1">
                          {proofFile ? `1 Item Selected` : "PNG, JPG up to 5MB"}
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="relative">
                    <textarea
                      value={proof}
                      onChange={(e) => setProof(e.target.value)}
                      placeholder="Or enter proof details here..."
                      className={cn(
                        "w-full p-4 rounded-2xl border focus:ring-2 focus:ring-pink-500 transition-all text-sm font-bold min-h-[100px]",
                        theme === 'dark' ? "bg-[#0a0b14] border-[#303456]" : "bg-slate-50 border-slate-200"
                      )}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || (!proof.trim() && !proofFile)}
                  className="w-full bg-pink-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Submit Mission <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
