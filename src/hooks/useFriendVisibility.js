import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../lib/firebase";

export function useFriendVisibility(userId) {
  const [showFriends, setShowFriends] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setShowFriends(false);
      setLoading(false);
      return;
    }

    const privacyRef = ref(db, `users/${userId}/settings/privacy/friendsVisibility`);
    const unsubscribe = onValue(privacyRef, (snapshot) => {
      const visibility = snapshot.val() || "friends"; // Default to friends if not set
      setShowFriends(visibility !== "noone");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { showFriends, loading };
}
