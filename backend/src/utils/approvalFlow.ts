import { Role } from '../types';
import { prisma } from './prismaClient';

export const approvalFlow: Record<Role, Role[]> = {
  [Role.STUDENT]:   [Role.PROFESSOR, Role.HOD],
  [Role.PROFESSOR]: [Role.HOD, Role.PRINCIPAL],
  [Role.HOD]:       [Role.PRINCIPAL],
  [Role.PRINCIPAL]: [],
};

export async function checkHodOnLeave(): Promise<boolean> {
  const today = new Date();
  const hod = await prisma.leave.findFirst({
    where: {
      status: 'APPROVED',
      startDate: { lte: today },
      endDate:   { gte: today },
      user: { role: Role.HOD },
    },
  });
  return !!hod;
}

export async function getNextApproverDynamic(
  applicantRole: Role,
  currentApproverRole?: Role | null
): Promise<Role | null> {
  const hodAbsent = await checkHodOnLeave();

  // Build effective flow — skip HOD if absent
  let flow = approvalFlow[applicantRole];
  if (hodAbsent) {
    flow = flow.filter((r) => r !== Role.HOD);
  }

  if (!flow || flow.length === 0) return null;
  if (!currentApproverRole) return flow[0];

  const idx = flow.indexOf(currentApproverRole);
  if (idx === -1 || idx === flow.length - 1) return null;
  return flow[idx + 1];
}

// Sync version kept for non-async contexts (uses static flow only)
export const getNextApprover = (
  applicantRole: Role,
  currentApproverRole?: Role | null
): Role | null => {
  const flow = approvalFlow[applicantRole];
  if (!flow || flow.length === 0) return null;
  if (!currentApproverRole) return flow[0];
  const idx = flow.indexOf(currentApproverRole);
  if (idx === -1 || idx === flow.length - 1) return null;
  return flow[idx + 1];
};
