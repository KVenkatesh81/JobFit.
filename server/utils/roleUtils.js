// Roles where DSA/CP is NOT required
const NON_DSA_ROLES = [
  'ui', 'ux', 'ui/ux', 'designer', 'design',
  'product manager', 'pm', 'product',
  'data analyst', 'business analyst', 'analyst',
  'devops', 'sre', 'infrastructure', 'cloud',
  'marketing', 'sales', 'hr', 'recruiter',
  'content', 'writer', 'copywriter',
  'project manager', 'scrum master', 'agile',
  'qa', 'tester', 'test engineer',
  'manager', 'lead', 'director',
  'data scientist', 'ml engineer', 'machine learning',
  'android', 'ios', 'mobile',
  'blockchain', 'web3',
];

function requiresDSA(targetRole) {
  if (!targetRole) return true; // default assume DSA needed
  const role = targetRole.toLowerCase();
  return !NON_DSA_ROLES.some(r => role.includes(r));
}

function getDSAContext(targetRole) {
  if (requiresDSA(targetRole)) {
    return {
      needed: true,
      instruction: `This role requires DSA/Competitive Programming skills. OAs at most tech companies test DSA heavily. Evaluate DSA/CP presence in the resume and mention if Codeforces/LeetCode ratings or contest achievements are missing.`,
    };
  }
  return {
    needed: false,
    instruction: `This is a ${targetRole} role. DSA/Competitive Programming is NOT required or relevant for this role. Do NOT mention DSA, LeetCode, Codeforces, or competitive programming anywhere in your analysis. Focus on role-specific skills instead.`,
  };
}

module.exports = { requiresDSA, getDSAContext };
