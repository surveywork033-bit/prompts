import { useState, useEffect } from "react";
import { Bell, Check, Trash2, Heart, MessageSquare, UserPlus, ShieldAlert, Bookmark } from "lucide-react";
import { Notification, UserProfile } from "../types";

interface NotificationsPageProps {
  currentUser: UserProfile | null;
  onNavigate: (view: string) => void;
  onSelectPrompt: (promptId: string) => void;
}

export default function NotificationsPage({ currentUser, onNavigate, onSelectPrompt }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl py-12 px-4 text-center text-zinc-400">
        <Bell className="h-10 w-10 text-zinc-650 mx-auto mb-3" />
        <span className="text-xs font-mono font-medium block">Please Sign In to explore notifications</span>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-purple-400 fill-current" />;
      case "save":
        return <Bookmark className="h-4 w-4 text-indigo-400" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-cyan-400" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-yellow-400" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-rose-455" />;
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-12 text-zinc-101 text-left">
      
      <div className="flex items-center justify-between mb-6 border-b border-zinc-850 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">System Notifications</h1>
          <p className="text-xs text-zinc-500">Live logs tracking social nodes and creator updates.</p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-1 py-1.5 px-3 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-350 hover:text-white transition"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/10 border border-zinc-900 rounded-2xl">
              <span className="text-xs text-zinc-500 italic">No notification traces in this matrix index yet.</span>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.link) {
                    onSelectPrompt(notif.link);
                  }
                }}
                className={`p-4 rounded-xl border transition flex items-start space-x-3 cursor-pointer ${
                  notif.read
                    ? "bg-zinc-950/20 border-zinc-900/50 hover:border-zinc-800"
                    : "bg-purple-950/5 border-purple-500/15 border-purple-500/20 hover:border-purple-500/35"
                }`}
              >
                <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-zinc-200">{notif.title}</span>
                    <span className="text-[9px] font-mono text-zinc-600">
                      {new Date(notif.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
