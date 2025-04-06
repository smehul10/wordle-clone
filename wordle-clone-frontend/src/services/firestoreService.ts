import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { app } from "./firebaseConfig";

const db = getFirestore(app);

export const updateUserStats = async (uid: string, didWin: boolean) => {
  const userRef = doc(db, "users", uid);
  const docSnap = await getDoc(userRef);

  const today = new Date().toISOString().split("T")[0];

  if (!docSnap.exists()) {
    // First game
    await setDoc(userRef, {
      totalWins: didWin ? 1 : 0,
      totalGames: 1,
      currentStreak: didWin ? 1 : 0,
      longestStreak: didWin ? 1 : 0,
      lastGameDate: today
    });
  } else {
    const data = docSnap.data();
    const playedToday = data.lastGameDate === today;
    if (playedToday) return; // Skip duplicate updates

    const newStreak = didWin ? data.currentStreak + 1 : 0;
    const longestStreak = Math.max(newStreak, data.longestStreak);

    await updateDoc(userRef, {
      totalGames: data.totalGames + 1,
      totalWins: didWin ? data.totalWins + 1 : data.totalWins,
      currentStreak: newStreak,
      longestStreak: longestStreak,
      lastGameDate: today
    });
  }
};