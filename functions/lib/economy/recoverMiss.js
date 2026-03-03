"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoverMiss = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("../utils/admin");
exports.recoverMiss = (0, https_1.onCall)(async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "User not logged in");
    const { habitId, date } = request.data;
    if (!habitId || !date)
        throw new https_1.HttpsError("invalid-argument", "habitId and date are required");
    const userRef = admin_1.admin.firestore().collection("users").doc(uid);
    const userDoc = await userRef.get();
    const user = userDoc.data();
    if (!user)
        throw new https_1.HttpsError("not-found", "User not found");
    if ((user.diamonds || 0) < 10) {
        throw new https_1.HttpsError("failed-precondition", "Not enough diamonds");
    }
    await admin_1.admin.firestore().runTransaction(async (tx) => {
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
            missesRecovered: admin_1.admin.firestore.FieldValue.arrayUnion(date)
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
//# sourceMappingURL=recoverMiss.js.map