const db = require('../config/db');

// ═══════════════════════════════════════════
// ENGINE 1 — SLA BREACH RISK SCORE
// ═══════════════════════════════════════════

const calculateBreachRisk = async (ticket) => {
try {
if (!ticket.sla_deadline) return { score: 0, reason: 'No SLA deadline set' };
if (['resolved', 'closed', 'pending_verification'].includes(ticket.status)) {
    return { score: 0, reason: 'Ticket already resolved' };
}

const now = new Date();
const deadline = new Date(ticket.sla_deadline);
const created = new Date(ticket.created_at);

const totalWindow = (deadline - created) / (1000 * 60);
const timeUsed = (now - created) / (1000 * 60);
const timeRemaining = (deadline - now) / (1000 * 60);

if (timeRemaining <= 0) {
    return {
    score: 100,
    reason: `SLA deadline has already passed by ${Math.abs(Math.round(timeRemaining))} minutes`
    };
}

// Factor 1: Time consumption ratio (40% weight)
const timeRatio = Math.min((timeUsed / totalWindow) * 100, 100);
const timeFactor = timeRatio * 0.40;

// Factor 2: Agent workload (30% weight)
let agentFactor = 0;
if (ticket.agent_id) {
    const [agentTickets] = await db.execute(`
    SELECT COUNT(*) AS open_count 
    FROM tickets 
    WHERE agent_id = ? AND status IN ('open', 'in_progress')
    `, [ticket.agent_id]);

    const openCount = agentTickets[0].open_count;
    const agentLoadRatio = Math.min((openCount / 5) * 100, 100);
    agentFactor = agentLoadRatio * 0.30;
}

// Factor 3: Historical resolution time for this category (30% weight)
let historyFactor = 0;
if (ticket.category_id) {
    const [history] = await db.execute(`
    SELECT AVG(
        TIMESTAMPDIFF(MINUTE, created_at, updated_at)
    ) AS avg_resolution_minutes
    FROM tickets
    WHERE category_id = ? 
    AND status IN ('resolved', 'closed')
    `, [ticket.category_id]);

    const avgResolutionMins = history[0].avg_resolution_minutes;
    if (avgResolutionMins && timeRemaining < avgResolutionMins) {
    const overrunRatio = Math.min(
        ((avgResolutionMins - timeRemaining) / avgResolutionMins) * 100,
        100
    );
    historyFactor = overrunRatio * 0.30;
    }
}

const finalScore = Math.round(timeFactor + agentFactor + historyFactor);

// Generate plain English reason
const reasons = [];
if (timeRatio > 60) reasons.push(`${Math.round(timeRatio)}% of SLA time used`);
if (ticket.agent_id) {
    const [ac] = await db.execute(
    `SELECT COUNT(*) AS c FROM tickets WHERE agent_id = ? AND status IN ('open','in_progress')`,
    [ticket.agent_id]
    );
    if (ac[0].c > 3) reasons.push(`agent has ${ac[0].c} open tickets`);
}
if (timeRemaining < 60) reasons.push(`only ${Math.round(timeRemaining)} minutes remaining`);

const reason = reasons.length > 0
    ? reasons.join(', ')
    : 'Ticket is within acceptable risk range';

return { score: Math.min(finalScore, 100), reason };

} catch (error) {
console.error('Breach risk calculation error:', error.message);
return { score: 0, reason: 'Calculation error' };
}
};

// ═══════════════════════════════════════════
// ENGINE 2 — AGENT BURNOUT SCORE
// ═══════════════════════════════════════════

const calculateBurnoutScore = async (agentId) => {
try {
const [openTickets] = await db.execute(`
    SELECT COUNT(*) AS count FROM tickets
    WHERE agent_id = ? AND status IN ('open', 'in_progress')
`, [agentId]);

const [criticalTickets] = await db.execute(`
    SELECT COUNT(*) AS count FROM tickets
    WHERE agent_id = ? 
    AND status IN ('open', 'in_progress')
    AND priority IN ('critical', 'high')
`, [agentId]);

const [resolvedToday] = await db.execute(`
    SELECT COUNT(*) AS count FROM tickets
    WHERE agent_id = ?
    AND status IN ('resolved', 'closed')
    AND DATE(updated_at) = CURDATE()
`, [agentId]);

const [lastResolution] = await db.execute(`
    SELECT updated_at FROM tickets
    WHERE agent_id = ?
    AND status IN ('resolved', 'closed')
    ORDER BY updated_at DESC
    LIMIT 1
`, [agentId]);

const openCount = openTickets[0].count;
const criticalCount = criticalTickets[0].count;
const resolvedTodayCount = resolvedToday[0].count;

let hoursSinceLastResolution = 8;
if (lastResolution.length > 0) {
    const lastResolvedAt = new Date(lastResolution[0].updated_at);
    hoursSinceLastResolution = (new Date() - lastResolvedAt) / (1000 * 60 * 60);
}

const openFactor = Math.min((openCount / 8) * 100, 100) * 0.40;
const criticalFactor = Math.min((criticalCount / 3) * 100, 100) * 0.30;
const hoursFactor = Math.min((hoursSinceLastResolution / 4) * 100, 100) * 0.30;

const burnoutScore = Math.round(openFactor + criticalFactor + hoursFactor);

let burnout_level;
if (burnoutScore >= 70) burnout_level = 'high';
else if (burnoutScore >= 40) burnout_level = 'medium';
else burnout_level = 'low';

return {
    burnout_score: Math.min(burnoutScore, 100),
    burnout_level,
    open_tickets: openCount,
    resolved_today: resolvedTodayCount,
    critical_tickets: criticalCount,
    hours_since_last_resolution: Math.round(hoursSinceLastResolution * 10) / 10,
    is_paused: burnout_level === 'high'
};

} catch (error) {
console.error('Burnout score calculation error:', error.message);
return null;
}
};

// ═══════════════════════════════════════════
// ENGINE 3 — VOLUME FORECAST
// ═══════════════════════════════════════════

const calculateVolumeForecast = async () => {
try {
const [dailyCounts] = await db.execute(`
    SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS count
    FROM tickets
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
`);

if (dailyCounts.length < 3) {
    return {
    forecast: null,
    message: 'Not enough historical data for forecast (need at least 3 days)'
    };
}

const counts = dailyCounts.map(d => d.count);
const last7 = counts.slice(-7);
const avg = last7.reduce((a, b) => a + b, 0) / last7.length;
const forecast = Math.round(avg);

const [todayCount] = await db.execute(`
    SELECT COUNT(*) AS count FROM tickets
    WHERE DATE(created_at) = CURDATE()
`);

let loadLevel;
if (forecast > 15) loadLevel = 'HIGH';
else if (forecast > 8) loadLevel = 'MEDIUM';
else loadLevel = 'LOW';

const [agents] = await db.execute(
    'SELECT COUNT(*) AS count FROM users WHERE role = ?', ['agent']
);
const agentCount = agents[0].count;
const capacity = agentCount * 5;

return {
    forecast_tickets_tomorrow: forecast,
    load_level: loadLevel,
    agent_capacity: capacity,
    agent_count: agentCount,
    today_count: todayCount[0].count,
    historical_data: dailyCounts,
    recommendation: forecast > capacity
    ? `Warning: Expected ${forecast} tickets exceeds agent capacity of ${capacity}. Consider adding agents.`
    : `Capacity looks sufficient. ${agentCount} agents can handle expected ${forecast} tickets.`
};

} catch (error) {
console.error('Forecast calculation error:', error.message);
return null;
}
};

module.exports = {
calculateBreachRisk,
calculateBurnoutScore,
calculateVolumeForecast
};