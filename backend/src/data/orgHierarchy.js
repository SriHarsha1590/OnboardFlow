const ORG_STRUCTURE = [
  {
    department: 'Executive Leadership',
    roles: [
      { title: 'Board of Directors', reportsTo: null },
      { title: 'Founder / Managing Director', reportsTo: 'Board of Directors' },
      { title: 'Chief Executive Officer (CEO)', reportsTo: 'Board of Directors' },
      { title: 'Chief Operating Officer (COO)', reportsTo: 'Chief Executive Officer (CEO)' },
      { title: 'Chief Technology Officer (CTO)', reportsTo: 'Chief Executive Officer (CEO)' },
      { title: 'Chief Financial Officer (CFO)', reportsTo: 'Chief Executive Officer (CEO)' },
      { title: 'Chief Human Resources Officer (CHRO)', reportsTo: 'Chief Executive Officer (CEO)' },
      { title: 'Chief Information Security Officer (CISO)', reportsTo: 'Chief Executive Officer (CEO)' },
      { title: 'VP Sales', reportsTo: 'Chief Executive Officer (CEO)' },
    ],
  },
  {
    department: 'Operations',
    roles: [
      { title: 'VP Operations', reportsTo: 'Chief Operating Officer (COO)' },
      { title: 'Operations Director', reportsTo: 'VP Operations' },
      { title: 'Operations Manager', reportsTo: 'Operations Director' },
      { title: 'Resource Manager', reportsTo: 'Operations Manager' },
      { title: 'Workforce Planning Lead', reportsTo: 'Resource Manager' },
      { title: 'Process Excellence Manager', reportsTo: 'Operations Director' },
      { title: 'MIS Analyst', reportsTo: 'Operations Manager' },
    ],
  },
  {
    department: 'Delivery / Client Success',
    roles: [
      { title: 'VP Delivery', reportsTo: 'Chief Operating Officer (COO)' },
      { title: 'Delivery Director', reportsTo: 'VP Delivery' },
      { title: 'Senior Delivery Manager', reportsTo: 'Delivery Director' },
      { title: 'Delivery Manager', reportsTo: 'Senior Delivery Manager' },
      { title: 'Program Manager', reportsTo: 'Delivery Manager' },
      { title: 'Project Manager', reportsTo: 'Program Manager' },
      { title: 'Associate Project Manager', reportsTo: 'Project Manager' },
      { title: 'Scrum Master', reportsTo: 'Project Manager' },
      { title: 'Client Success Manager', reportsTo: 'Delivery Director' },
      { title: 'PMO Lead', reportsTo: 'Delivery Director' },
      { title: 'PMO Analyst', reportsTo: 'PMO Lead' },
    ],
  },
  {
    department: 'Engineering / Product Development',
    roles: [
      { title: 'VP Engineering', reportsTo: 'Chief Technology Officer (CTO)' },
      { title: 'Engineering Director', reportsTo: 'VP Engineering' },
      { title: 'Engineering Manager', reportsTo: 'Engineering Director' },
      { title: 'Development Manager', reportsTo: 'Engineering Manager' },
      { title: 'Technical Architect', reportsTo: 'Engineering Director' },
      { title: 'Solution Architect', reportsTo: 'Engineering Director' },
      { title: 'Enterprise Architect', reportsTo: 'Chief Technology Officer (CTO)' },
      { title: 'Technical Lead', reportsTo: 'Development Manager' },
      { title: 'Team Lead', reportsTo: 'Technical Lead' },
      { title: 'Senior Software Engineer', reportsTo: 'Team Lead' },
      { title: 'Software Engineer', reportsTo: 'Team Lead' },
      { title: 'Associate Software Engineer', reportsTo: 'Team Lead' },
      { title: 'Junior Developer', reportsTo: 'Team Lead' },
      { title: 'Intern Developer', reportsTo: 'Team Lead' },
      { title: 'Java Developer', reportsTo: 'Team Lead' },
      { title: '.NET Developer', reportsTo: 'Team Lead' },
      { title: 'Python Developer', reportsTo: 'Team Lead' },
      { title: 'Node.js Developer', reportsTo: 'Team Lead' },
      { title: 'React Developer', reportsTo: 'Team Lead' },
      { title: 'Angular Developer', reportsTo: 'Team Lead' },
      { title: 'Full Stack Developer', reportsTo: 'Team Lead' },
      { title: 'Mobile Developer', reportsTo: 'Team Lead' },
      { title: 'API Developer', reportsTo: 'Team Lead' },
    ],
  },
  {
    department: 'QA / Testing',
    roles: [
      { title: 'QA Director', reportsTo: 'VP Engineering' },
      { title: 'QA Manager', reportsTo: 'QA Director' },
      { title: 'QA Lead', reportsTo: 'QA Manager' },
      { title: 'Senior QA Engineer', reportsTo: 'QA Lead' },
      { title: 'QA Engineer', reportsTo: 'QA Lead' },
      { title: 'Automation Test Engineer', reportsTo: 'QA Lead' },
      { title: 'Performance Tester', reportsTo: 'QA Lead' },
      { title: 'UAT Coordinator', reportsTo: 'QA Manager' },
    ],
  },
  {
    department: 'DevOps / Cloud / SRE',
    roles: [
      { title: 'Head of Cloud Engineering', reportsTo: 'Chief Technology Officer (CTO)' },
      { title: 'Cloud Director', reportsTo: 'Head of Cloud Engineering' },
      { title: 'DevOps Manager', reportsTo: 'Cloud Director' },
      { title: 'DevOps Lead', reportsTo: 'DevOps Manager' },
      { title: 'DevOps Engineer', reportsTo: 'DevOps Lead' },
      { title: 'Release Manager', reportsTo: 'DevOps Manager' },
      { title: 'Build Engineer', reportsTo: 'DevOps Lead' },
      { title: 'Site Reliability Engineer (SRE)', reportsTo: 'DevOps Manager' },
      { title: 'Platform Engineer', reportsTo: 'DevOps Manager' },
      { title: 'Kubernetes Engineer', reportsTo: 'DevOps Lead' },
      { title: 'Cloud Architect', reportsTo: 'Cloud Director' },
      { title: 'AWS Engineer', reportsTo: 'DevOps Lead' },
      { title: 'Azure Engineer', reportsTo: 'DevOps Lead' },
      { title: 'GCP Engineer', reportsTo: 'DevOps Lead' },
    ],
  },
  {
    department: 'Data / AI / Analytics',
    roles: [
      { title: 'Head of Data & AI', reportsTo: 'Chief Technology Officer (CTO)' },
      { title: 'Data Engineering Manager', reportsTo: 'Head of Data & AI' },
      { title: 'Data Architect', reportsTo: 'Head of Data & AI' },
      { title: 'Data Engineer', reportsTo: 'Data Engineering Manager' },
      { title: 'BI Developer', reportsTo: 'Data Engineering Manager' },
      { title: 'Data Analyst', reportsTo: 'Head of Data & AI' },
      { title: 'Data Scientist', reportsTo: 'Head of Data & AI' },
      { title: 'ML Engineer', reportsTo: 'Head of Data & AI' },
      { title: 'AI Engineer', reportsTo: 'Head of Data & AI' },
    ],
  },
  {
    department: 'Cybersecurity',
    roles: [
      { title: 'Security Director', reportsTo: 'Chief Information Security Officer (CISO)' },
      { title: 'SOC Manager', reportsTo: 'Security Director' },
      { title: 'SOC Lead', reportsTo: 'SOC Manager' },
      { title: 'SOC Analyst L1', reportsTo: 'SOC Lead' },
      { title: 'SOC Analyst L2', reportsTo: 'SOC Lead' },
      { title: 'SOC Analyst L3', reportsTo: 'SOC Lead' },
      { title: 'Security Engineer', reportsTo: 'Security Director' },
      { title: 'Cloud Security Engineer', reportsTo: 'Security Director' },
      { title: 'IAM Engineer', reportsTo: 'Security Director' },
      { title: 'GRC Manager', reportsTo: 'Security Director' },
      { title: 'GRC Analyst', reportsTo: 'GRC Manager' },
      { title: 'Vulnerability Analyst', reportsTo: 'Security Director' },
      { title: 'Incident Response Lead', reportsTo: 'Security Director' },
      { title: 'Threat Hunter', reportsTo: 'Security Director' },
      { title: 'Penetration Tester', reportsTo: 'Security Director' },
    ],
  },
  {
    department: 'Product / Business Analysis / UX',
    roles: [
      { title: 'VP Product', reportsTo: 'Chief Technology Officer (CTO)' },
      { title: 'Product Director', reportsTo: 'VP Product' },
      { title: 'Product Manager', reportsTo: 'Product Director' },
      { title: 'Associate Product Manager', reportsTo: 'Product Manager' },
      { title: 'Business Analyst Manager', reportsTo: 'Product Director' },
      { title: 'Senior Business Analyst', reportsTo: 'Business Analyst Manager' },
      { title: 'Business Analyst', reportsTo: 'Business Analyst Manager' },
      { title: 'UI/UX Manager', reportsTo: 'Product Director' },
      { title: 'UI/UX Designer', reportsTo: 'UI/UX Manager' },
      { title: 'Graphic Designer', reportsTo: 'UI/UX Manager' },
    ],
  },
  {
    department: 'Sales / Business Development',
    roles: [
      { title: 'Sales Director', reportsTo: 'VP Sales' },
      { title: 'Regional Sales Manager', reportsTo: 'Sales Director' },
      { title: 'Account Manager', reportsTo: 'Regional Sales Manager' },
      { title: 'Business Development Manager', reportsTo: 'Sales Director' },
      { title: 'Inside Sales Executive', reportsTo: 'Business Development Manager' },
      { title: 'Pre-Sales Manager', reportsTo: 'VP Sales' },
      { title: 'Solution Consultant', reportsTo: 'Pre-Sales Manager' },
      { title: 'Proposal Manager', reportsTo: 'Pre-Sales Manager' },
    ],
  },
  {
    department: 'HR / Recruitment / L&D',
    roles: [
      { title: 'HR Director', reportsTo: 'Chief Human Resources Officer (CHRO)' },
      { title: 'HR Manager', reportsTo: 'HR Director' },
      { title: 'HR Business Partner', reportsTo: 'HR Manager' },
      { title: 'Talent Acquisition Manager', reportsTo: 'HR Director' },
      { title: 'Recruitment Lead', reportsTo: 'Talent Acquisition Manager' },
      { title: 'Recruiter', reportsTo: 'Recruitment Lead' },
      { title: 'HR Executive', reportsTo: 'HR Manager' },
      { title: 'L&D Manager', reportsTo: 'HR Director' },
      { title: 'Training Coordinator', reportsTo: 'L&D Manager' },
      { title: 'Payroll Specialist', reportsTo: 'HR Manager' },
    ],
  },
  {
    department: 'Fresher / New Joinee',
    roles: [
      { title: 'Fresher', reportsTo: 'L&D Manager', managerDepartment: 'HR / Recruitment / L&D' },
      { title: 'New Joinee', reportsTo: 'L&D Manager', managerDepartment: 'HR / Recruitment / L&D' },
    ],
  },
  {
    department: 'Finance / Legal / Procurement',
    roles: [
      { title: 'Finance Controller', reportsTo: 'Chief Financial Officer (CFO)' },
      { title: 'Finance Manager', reportsTo: 'Finance Controller' },
      { title: 'Senior Accountant', reportsTo: 'Finance Manager' },
      { title: 'Accountant', reportsTo: 'Finance Manager' },
      { title: 'Accounts Payable Specialist', reportsTo: 'Finance Manager' },
      { title: 'Accounts Receivable Specialist', reportsTo: 'Finance Manager' },
      { title: 'Procurement Manager', reportsTo: 'Chief Financial Officer (CFO)' },
      { title: 'Purchase Executive', reportsTo: 'Procurement Manager' },
      { title: 'Legal Counsel', reportsTo: 'Chief Financial Officer (CFO)' },
      { title: 'Contract Specialist', reportsTo: 'Legal Counsel' },
    ],
  },
  {
    department: 'IT Support / Internal IT',
    roles: [
      { title: 'IT Director', reportsTo: 'Chief Operating Officer (COO)' },
      { title: 'IT Manager', reportsTo: 'IT Director' },
      { title: 'System Administrator', reportsTo: 'IT Manager' },
      { title: 'Network Engineer', reportsTo: 'IT Manager' },
      { title: 'Helpdesk Lead', reportsTo: 'IT Manager' },
      { title: 'IT Support Engineer', reportsTo: 'Helpdesk Lead' },
      { title: 'Desktop Support Engineer', reportsTo: 'Helpdesk Lead' },
    ],
  },
  {
    department: 'Admin / Facilities',
    roles: [
      { title: 'Admin Manager', reportsTo: 'Chief Operating Officer (COO)' },
      { title: 'Facilities Manager', reportsTo: 'Admin Manager' },
      { title: 'Travel Desk Executive', reportsTo: 'Admin Manager' },
      { title: 'Front Office Executive', reportsTo: 'Admin Manager' },
      { title: 'Office Administrator', reportsTo: 'Admin Manager' },
    ],
  },
];

const ROLE_ALIASES = {
  'CEO': 'Chief Executive Officer (CEO)',
  'COO': 'Chief Operating Officer (COO)',
  'CTO': 'Chief Technology Officer (CTO)',
  'CFO': 'Chief Financial Officer (CFO)',
  'CHRO': 'Chief Human Resources Officer (CHRO)',
  'CISO': 'Chief Information Security Officer (CISO)',
  'Head of Cloud': 'Head of Cloud Engineering',
  'Head of Data': 'Head of Data & AI',
  'BA Manager': 'Business Analyst Manager',
  'BDM': 'Business Development Manager',
  'TA Manager': 'Talent Acquisition Manager',
  'Controller': 'Finance Controller',
};

const DEPARTMENT_ALIASES = {
  Engineering: 'Engineering / Product Development',
  Product: 'Product / Business Analysis / UX',
  Design: 'Product / Business Analysis / UX',
  Marketing: 'Sales / Business Development',
  Finance: 'Finance / Legal / Procurement',
  Operations: 'Operations',
  HR: 'HR / Recruitment / L&D',
  Sales: 'Sales / Business Development',
  IT: 'IT Support / Internal IT',
};

function normalizeRole(role) {
  return ROLE_ALIASES[role] || role;
}

function normalizeDepartment(department) {
  return DEPARTMENT_ALIASES[department] || department;
}

function getDepartments() {
  return ORG_STRUCTURE.map((group) => group.department);
}

function getRolesByDepartment(department) {
  const normalizedDepartment = normalizeDepartment(department);
  const group = ORG_STRUCTURE.find((item) => item.department === normalizedDepartment);
  return group ? group.roles.map((role) => {
    const managerDepartment = normalizeDepartment(role.managerDepartment || group.department);
    const managerRole = role.reportsTo ? normalizeRole(role.reportsTo) : null;

    return {
      ...role,
      department: group.department,
      managerDepartment,
      manager: managerRole ? buildManagerProfile(managerRole, managerDepartment) : null,
    };
  }) : [];
}

function findRoleDefinition(role, department) {
  const normalizedRole = normalizeRole(role);
  const normalizedDepartment = normalizeDepartment(department);

  if (normalizedDepartment) {
    const roleInDepartment = getRolesByDepartment(normalizedDepartment).find((item) => item.title === normalizedRole);
    if (roleInDepartment) return roleInDepartment;
  }

  for (const group of ORG_STRUCTURE) {
    const roleMatch = group.roles.find((item) => item.title === normalizedRole);
    if (roleMatch) {
      return { ...roleMatch, department: group.department };
    }
  }

  return null;
}

function getDepartmentHeadRole(department) {
  const roles = getRolesByDepartment(department);
  if (roles.length === 0) return null;

  const roleTitles = new Set(roles.map((role) => role.title));
  const locallyManagedRoles = new Set(
    roles
      .map((role) => role.reportsTo)
      .filter((reportsTo) => reportsTo && roleTitles.has(reportsTo))
  );

  const head = roles.find(
    (role) => locallyManagedRoles.has(role.title) && (!role.reportsTo || !roleTitles.has(role.reportsTo))
  );

  return head?.title || null;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

const FIRST_NAMES = ['Aarav', 'Ananya', 'Rohan', 'Priya', 'Vikram', 'Meera', 'Arjun', 'Kavya', 'Rahul', 'Neha', 'Sanjay', 'Maya'];
const LAST_NAMES = ['Sharma', 'Patel', 'Reddy', 'Nair', 'Kapoor', 'Singh', 'Gupta', 'Iyer', 'Desai', 'Mehta', 'Kumar', 'Menon'];

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildManagerProfile(role, department) {
  const seed = `${role}::${department}`;
  const hash = hashString(seed);
  const firstName = FIRST_NAMES[hash % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor(hash / FIRST_NAMES.length) % LAST_NAMES.length];

  return {
    name: `${firstName} ${lastName}`,
    email: 'sriharshanandiraju@gmail.com',
    department,
    role,
    manager_type: 'ORG_GENERATED',
  };
}

function buildManagerSeedRows() {
  const seen = new Set();
  const rows = [];

  for (const group of ORG_STRUCTURE) {
    for (const role of group.roles) {
      const key = `${group.department}::${role.title}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const departmentHeadRole = getDepartmentHeadRole(group.department);
      let managerType = 'ROLE_NODE';
      if (!role.reportsTo) managerType = 'EXECUTIVE';
      else if (departmentHeadRole === role.title) managerType = 'DEPARTMENT_HEAD';
      else if (group.roles.some((candidate) => candidate.reportsTo === role.title)) managerType = 'PEOPLE_MANAGER';

      const managerProfile = buildManagerProfile(role.title, group.department);

      rows.push({
        name: managerProfile.name,
        email: managerProfile.email,
        department: group.department,
        role: role.title,
        manager_type: managerType,
      });
    }
  }

  return rows;
}

module.exports = {
  ORG_STRUCTURE,
  normalizeRole,
  normalizeDepartment,
  getDepartments,
  getRolesByDepartment,
  findRoleDefinition,
  getDepartmentHeadRole,
  buildManagerSeedRows,
  buildManagerProfile,
};
