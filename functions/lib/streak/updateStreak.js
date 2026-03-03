"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyStreakCheck = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const date_fns_1 = require("date-fns");
const admin_1 = require("../utils/admin");
exports.dailyStreakCheck = (0, scheduler_1.onSchedule)("every 24 hours", async () => {
    var _a;
    // Run this at midnight or end of day in target timezone
    const now = new Date();
    const yesterdayDateString = (0, date_fns_1.subDays)(now, 1).toISOString().slice(0, 10); // "YYYY-MM-DD"
    const monthId = yesterdayDateString.slice(0, 7); // "YYYY-MM"
    const day = yesterdayDateString.slice(8, 10); // "DD"
    const usersSnapshot = await admin_1.admin.firestore().collection("users").get();
    for (const doc of usersSnapshot.docs) {
        const userRef = doc.ref;
        // Note: For a true streak check, you need to know how many habits the user has active
        // and if they completed all of them in the `logs` collection for `yesterday`.
        // This is a simplified skeleton showing how you'd reset or increment.
        try {
            const logsDoc = await userRef.collection("logs").doc(monthId).get();
            const logsData = logsDoc.data();
            // Check if user used a diamond recovery for yesterday
            const missesRecovered = (logsData === null || logsData === void 0 ? void 0 : logsData.missesRecovered) || [];
            const recoveredYesterday = missesRecovered.includes(yesterdayDateString);
            // Fetch active habits to see if they completed all required
            const habitsSnapshot = await userRef.collection("habits").where("archived", "==", false).get();
            const activeHabitIds = habitsSnapshot.docs.map(h => h.id);
            const dailyLogs = ((_a = logsData === null || logsData === void 0 ? void 0 : logsData.daily) === null || _a === void 0 ? void 0 : _a[day]) || {};
            // Check if ALL active habits were completed yesterday
            const allCompleted = activeHabitIds.length > 0 && activeHabitIds.every(id => dailyLogs[id] === true);
            if (allCompleted || recoveredYesterday) {
                // Keep extending streak (or it was extended when they completed the habit)
                // Just to be safe, could recount here.
            }
            else {
                // They missed yesterday
                await userRef.update({
                    currentStreak: 0
                });
            }
        }
        catch (error) {
            console.error(`Error checking streak for user ${doc.id}:`, error);
        }
    }
});
//# sourceMappingURL=updateStreak.js.map