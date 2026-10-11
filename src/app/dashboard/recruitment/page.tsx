import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import RecruitmentClient from './RecruitmentClient';

export default async function RecruitmentPage() {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'HR_MANAGER' && session.role !== 'HR')) {
    redirect('/dashboard');
  }

  // Pre-fetch initial data
  const [initialJobs, initialCandidates] = await Promise.all([
    prisma.jobPosting.findMany({
      include: {
        _count: {
          select: { candidates: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.candidate.findMany({
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: true
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    })
  ]);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <RecruitmentClient 
        initialJobs={JSON.parse(JSON.stringify(initialJobs))} 
        initialCandidates={JSON.parse(JSON.stringify(initialCandidates))} 
      />
    </div>
  );
}
