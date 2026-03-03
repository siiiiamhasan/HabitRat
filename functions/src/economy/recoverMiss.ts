import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { admin } from '../utils/admin';

export const recoverMiss = onCall(async (request: CallableRequest) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "User not logged in");

    const { habitId, date } = request.data;
    if (!habitId || !date) throw new HttpsError("invalid-argument", "habitId and date are required");

    const userRef = admin.firestore().collection("users").doc(uid);
    const userDoc = await userRef.get();
    const user = userDoc.data();

    if (!user) throw new HttpsError("not-found", "User not found");
    if ((user.diamonds || 0) < 10) {
        throw new HttpsError("failed-precondition", "Not enough diamonds");
    }

    await admin.firestore().runTransaction(async (tx) => {
        tx.update(userRef, {
            diamonds: user.diamonds - 10,
            totalDiamondsSpent: (user.totalDiamondsSpent || 0) + 10
        });

        // Parse date expecting "YYYY-MM-DD"
        const monthId = date.slice(0, 7); // "YYYY-MM"
        const day = date.slice(8, 10); // "DD"

        const logRef = userRef.collection("logs").doc(monthId);

        tx.update(logRef, {
            [`daily.${day}.${habitId}`]: true,
            missesRecovered: admin.firestore.FieldValue.arrayUnion(date)
        });

        const transactionRef = userRef.collection("transactions").doc();
        tx.set(transactionRef, {
            type: "recover_miss",
            amount: -10,
            createdAt: new Date(),
            metadata: { habitId, date }
        });
    });

    return { success: true };
});
