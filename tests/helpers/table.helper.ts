// Waits for a Vuetify data table's row count to stop changing before proceeding.
// Under parallel test load, a fixed `waitForTimeout` after `waitForSelector('tbody tr')`
// can fire while the table is still populating rows (e.g. 1 row rendered so far, more
// still loading), producing false failures like "Expected 25, Received 1". Polling until
// the count is stable across consecutive checks avoids that race without slowing down
// low-load runs (it exits as soon as the count stops moving).
export async function waitForTableStable(page: any, opts: { maxChecks?: number; intervalMs?: number; stableStreak?: number } = {}) {
    const maxChecks = opts.maxChecks ?? 15;
    const intervalMs = opts.intervalMs ?? 500;
    const requiredStreak = opts.stableStreak ?? 3;

    let lastCount = -1;
    let streak = 0;

    for (let i = 0; i < maxChecks && streak < requiredStreak; i++) {
        await page.waitForTimeout(intervalMs);
        const count = await page.locator('tbody tr').count().catch(() => -1);
        if (count === lastCount) {
            streak++;
        } else {
            streak = 0;
        }
        lastCount = count;
    }

    return lastCount;
}
