const keywords = {
    critical: [
    'payroll', 'salary', 'server down', 'production down', 'data loss',
    'security breach', 'hacked', 'ransomware', 'ceo', 'director', 'manager',
    'entire office', 'all users', 'nobody can', 'complete outage', 'database down',
    'cannot process', 'financial', 'urgent', 'emergency', 'critical'
    ],
    high: [
    'cannot login', 'email down', 'vpn', 'cannot access', 'not working',
    'team affected', 'multiple users', 'deadline', 'client meeting',
    'presentation', 'zoom', 'teams', 'internet down', 'wifi down',
    'password expired', 'locked out', 'cannot open'
    ],
    medium: [
    'slow', 'performance', 'printer', 'scanner', 'software crash',
    'application error', 'keeps restarting', 'freezing', 'lagging',
    'error message', 'not responding', 'update', 'install'
    ],
    low: [
    'cosmetic', 'minor', 'suggestion', 'small issue', 'when possible',
    'not urgent', 'low priority', 'sometime', 'eventually', 'font',
    'color', 'alignment', 'display issue'
    ]
};

const suggestPriority = (text) => {
    if (!text) return 'medium';

    const lowerText = text.toLowerCase();
    const scores = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const [priority, words] of Object.entries(keywords)) {
    for (const word of words) {
        if (lowerText.includes(word)) {
        scores[priority]++;
        }
    }
    }

    const highestScore = Math.max(...Object.values(scores));

    if (highestScore === 0) return 'medium';

    return Object.keys(scores).find(key => scores[key] === highestScore);
};

module.exports = suggestPriority;