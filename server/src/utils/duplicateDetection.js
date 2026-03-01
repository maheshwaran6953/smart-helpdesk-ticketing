const natural = require('natural');
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

const calculateSimilarity = (text1, text2) => {
if (!text1 || !text2) return 0;

const tokens1 = tokenizer.tokenize(text1.toLowerCase());
const tokens2 = tokenizer.tokenize(text2.toLowerCase());

const set1 = new Set(tokens1);
const set2 = new Set(tokens2);

const intersection = new Set([...set1].filter(word => set2.has(word)));

const union = new Set([...set1, ...set2]);

if (union.size === 0) return 0;

return intersection.size / union.size;
};

const findSimilarTickets = (newDescription, existingTickets, threshold = 0.3) => {
const similar = [];

for (const ticket of existingTickets) {
    const titleScore = calculateSimilarity(newDescription, ticket.title);

    const descScore = calculateSimilarity(newDescription, ticket.description);

    const finalScore = Math.max(titleScore, descScore);

    if (finalScore >= threshold) {
    similar.push({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        similarity_score: Math.round(finalScore * 100),
        created_at: ticket.created_at
    });
    }
}

return similar.sort((a, b) => b.similarity_score - a.similarity_score);
};

module.exports = { findSimilarTickets, calculateSimilarity };