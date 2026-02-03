import { useState, useEffect } from "react";
import { Navbar } from "../components/layout/Navbar";
import { useAuth } from "../features/auth/AuthContext";
import { useAlbums } from "../hooks/useAlbums";
import { useUserProfile } from "../hooks/useUserProfile";
import ImportExportModal from "../features/settings/ImportExportModal";
import LegacyImportModal from "../features/settings/LegacyImportModal";
import EditProfileModal from "../features/settings/EditProfileModal";
import { useToast } from "../components/ui/Toast";
import { LogOut, Database, Share2, User, ChevronRight, Settings as SettingsIcon, FileJson, Edit2, RotateCw, Globe, Users } from "lucide-react";
import { ref, update, get, set } from "firebase/database";
import { db } from "../lib/firebase";

export default function Settings() {
    const { user, logout } = useAuth();
    const { profile } = useUserProfile(user?.uid);
    const { albums, addAlbum, removeAlbum } = useAlbums();
    const { toast } = useToast();
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isLegacyImportModalOpen, setIsLegacyImportModalOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // Privacy State
    const [friendsVisibility, setFriendsVisibility] = useState("friends"); // 'friends' | 'noone'
    const [loadingPrivacy, setLoadingPrivacy] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchPrivacy = async () => {
             const snap = await get(ref(db, `users/${user.uid}/settings/privacy`));
             if (snap.exists()) {
                 setFriendsVisibility(snap.val().friendsVisibility || "friends");
             }
             setLoadingPrivacy(false);
        };
        fetchPrivacy();
    }, [user]);
    
    const handlePrivacyToggle = async () => {
        const newVal = friendsVisibility === 'friends' ? 'noone' : 'friends';
        setFriendsVisibility(newVal);
        try {
            await set(ref(db, `users/${user.uid}/settings/privacy/friendsVisibility`), newVal);
             toast({
                title: "Privacy Updated",
                description: `Friends list is now visible to: ${newVal === 'friends' ? 'Friends' : 'Only Me'}`,
            });
        } catch (e) {
            console.error(e);
            setFriendsVisibility(friendsVisibility); // Revert
             toast({
                title: "Update Failed",
                variant: 'destructive'
            });
        }
    };

    const displayPfp = profile?.pfp || user?.photoURL;
    const displayUsername = profile?.username || user?.displayName || 'User';

    const handleShareShelf = () => {
        if (!user) return;
        const url = `https://music-tracker-89fe5.web.app/u/${user.uid}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link Copied!",
            description: "Public shelf link copied to your clipboard.",
            variant: "default",
        });
    };

    const handleRepairSearch = async () => {
        if (!user || !profile) return;
        setRefreshing(true);
        try {
             const updates = {};
             // Update Search Index
             const indexData = {
                username: profile.username,
                displayName: profile.displayName || user.displayName || "User",
                pfp: profile.pfp || ""
             };
             updates[`userSearchIndex/${user.uid}`] = indexData;
             
             // Ensure username mapping is correct
             if (profile.username) {
                 updates[`usernames/${profile.username}`] = user.uid;
             }

             await update(ref(db), updates);
             toast({
                 title: "Search Index Repaired",
                 description: "Your profile should now be discoverable.",
             });
        } catch (e) {
            console.error(e);
            toast({
                 title: "Repair Failed",
                 description: e.message,
                 variant: "destructive"
            });
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white pb-20">
            <Navbar />
            
            <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-6 pb-8">
                <EditProfileModal 
                    isOpen={isEditProfileOpen} 
                    onClose={() => setIsEditProfileOpen(false)} 
                />

                <div className="flex items-center gap-3 mb-8">
                        <SettingsIcon className="text-emerald-500" size={32} />
                    <h1 className="text-3xl font-bold">Settings</h1>
                </div>

                <div className="space-y-6">
                    {/* Account Section */}
                    <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-800">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <User className="w-5 h-5 text-neutral-400" />
                                Account
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                {displayPfp ? (
                                    <img src={displayPfp} alt={displayUsername} className="w-16 h-16 rounded-full border-2 border-neutral-800 object-cover" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-bold text-neutral-400">
                                        {displayUsername?.[0] || '?'}
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-lg">{displayUsername}</p>
                                    <p className="text-neutral-400 text-sm">{user?.email}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleRepairSearch}
                                disabled={refreshing}
                                className="w-full flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors border border-transparent mb-2 group"
                            >
                                <span className="flex items-center gap-3 font-medium text-neutral-200">
                                    <RotateCw className={`w-5 h-5 text-blue-500 ${refreshing ? "animate-spin" : ""}`} />
                                    Repair Account Visibility
                                </span>
                                <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400" />
                            </button>

                            <button
                                onClick={() => setIsEditProfileOpen(true)}
                                className="w-full flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors border border-transparent mb-2 group"
                            >
                                <span className="flex items-center gap-3 font-medium text-neutral-200">
                                    <Edit2 className="w-5 h-5 text-emerald-500" />
                                    Edit Profile
                                </span>
                                <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
                            </button>
                            
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 hover:bg-red-900/20 hover:text-red-400 transition-colors border border-transparent hover:border-red-900/50 group"
                            >
                                <span className="flex items-center gap-3 font-medium">
                                    <LogOut className="w-5 h-5" />
                                    Sign Out
                                </span>
                                <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </section>


                    {/* Privacy Section */}
                    <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-800">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Globe className="w-5 h-5 text-neutral-400" />
                                Privacy
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-medium text-white">Friends List Visibility</h3>
                                    <p className="text-sm text-neutral-400">Control who can see your friends on your public profile</p>
                                </div>
                                <button
                                    onClick={handlePrivacyToggle}
                                    disabled={loadingPrivacy}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-neutral-900 ${
                                        friendsVisibility === 'friends' ? 'bg-emerald-600' : 'bg-neutral-700'
                                    }`}
                                >
                                    <span
                                        className={`${
                                            friendsVisibility === 'friends' ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                    />
                                </button>
                            </div>
                            <div className="text-xs text-neutral-500 bg-neutral-900/50 p-3 rounded border border-neutral-800">
                                Current setting: <span className="text-emerald-400 font-bold uppercase">{friendsVisibility === 'friends' ? 'Friends Only' : 'Only Me'}</span>
                            </div>
                        </div>
                    </section>

                    {/* Content Section */}
                    <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
                         <div className="px-6 py-4 border-b border-neutral-800">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Database className="w-5 h-5 text-neutral-400" />
                                Data & Privacy
                            </h2>
                        </div>
                        <div className="p-2">
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-neutral-800 transition-colors group"
                            >
                                <div className="text-left">
                                    <p className="font-medium text-white mb-1">Import / Export Data</p>
                                    <p className="text-sm text-neutral-400">Backup your library or import from JSON/CSV.</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                            </button>

                             <button
                                onClick={handleShareShelf}
                                className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-neutral-800 transition-colors group"
                            >
                                <div className="text-left">
                                    <p className="font-medium text-white mb-1">Share Public Shelf</p>
                                    <p className="text-sm text-neutral-400">Copy link to your public profile.</p>
                                </div>
                                <Share2 className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                            </button>

                             <button
                                onClick={() => setIsLegacyImportModalOpen(true)}
                                className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-neutral-800 transition-colors group"
                            >
                                <div className="text-left">
                                    <p className="font-medium text-white mb-1">Import Legacy Data</p>
                                    <p className="text-sm text-neutral-400">Migrate data from previous website (JSON).</p>
                                </div>
                                <FileJson className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    </section>
                </div>
            </main>

            <ImportExportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                user={user}
                albums={albums}
                addAlbum={addAlbum}
                removeAlbum={removeAlbum}
            />
             <LegacyImportModal
                isOpen={isLegacyImportModalOpen}
                onClose={() => setIsLegacyImportModalOpen(false)}
                addAlbum={addAlbum}
            />
        </div>
    );
}
