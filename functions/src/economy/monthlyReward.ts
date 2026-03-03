import { onSchedule } from 'firebase-functions/v2/scheduler';
import { differenceInDays } from 'date-fns';
import { admin } from '../utils/admin';

export const monthlyPremiumReward = onSchedule("every 24 hours", async () => {
    const usersSnapshot = await admin.firestore()
        .collection("users")
        .where("isPremium", "==", true)
        .get();

    for (const doc of usersSnapshot.docs) {
        const user = doc.data();
        const now = new Date();
        const lastReward = user.lastMonthlyDiamondReward?.toDate();

        if (!lastReward || differenceInDays(now, lastReward) >= 30) {
            await admin.firestore().runTransaction(async (tx) => {
                const userRef = doc.ref;

                tx.update(userRef, {
                    diamonds: (user.diamonds || 0) + 200,
                    lastMonthlyDiamondReward: now,
                    totalDiamondsEarned: (user.totalDiamondsEarned || 0) + 200
                });

                const transactionRef = userRef.collection("transactions").doc();
                tx.set(transactionRef, {
                    type: "monthly_reward",
                    amount: 200,
                    createdAt: now
                });
            });
        }
    }
});
