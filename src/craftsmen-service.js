const getMappedCraftsman = (craftsman) => ({
  id: craftsman.id,
  name: `${craftsman.first_name} ${craftsman.last_name}`,
  rankingScore: Math.round((craftsman.ranking_score + Number.EPSILON) * 100) / 100 
});

module.exports = {
  getMappedCraftsman,
}