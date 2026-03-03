"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthlyPremiumReward = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const date_fns_1 = require("date-fns");
const admin_1 = require("../utils/admin");
exports.monthlyPremiumReward = (0, scheduler_1.onSchedule)("every 24 hours", async () => {
    var _a;
    const usersSnapshot = await admin_1.admin.firestore()
        .collection("users")
        .where("isPremium", "==", true)
        .get();
    for (const doc of usersSnapshot.docs) {
        const user = doc.data();
        const now = new Date();
        const lastReward = (_a = user.lastMonthlyDiamondReward) === null || _a === void 0 ? void 0 : _a.toDate();
        if (!lastReward || (0, date_fns_1.differenceInDays)(now, lastReward) >= 30) {
            await admin_1.admin.firestore().runTransaction(async (tx) => {
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
//# sourceMappingURL=monthlyReward.js.map