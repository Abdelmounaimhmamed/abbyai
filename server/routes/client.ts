import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../lib/auth';

const router = express.Router();

// Apply authentication and role check to all routes
router.use(authenticateToken);
router.use(requireRole(['client']));

// Get client dashboard data
router.get('/dashboard', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get client profile with stats
    const profile = await prisma.clientProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            hasCompletedOnboarding: true
          }
        }
      }
    });

    // Get recent sessions
    const recentSessions = await prisma.session.findMany({
      where: { clientId: userId },
      include: {
        doctor: {
          select: { firstName: true, lastName: true }
        },
        quizResult: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get certifications progress
    const certifications = await prisma.userCertification.findMany({
      where: { userId },
      include: {
        certification: true
      }
    });

    // Calculate progress stats
    const completedSessions = await prisma.session.count({
      where: { 
        clientId: userId,
        status: 'completed'
      }
    });

    const completedQuizzes = await prisma.quizResult.count({
      where: { userId }
    });

    const nextSession = await prisma.session.findFirst({
      where: { 
        clientId: userId,
        status: 'scheduled',
        scheduledAt: {
          gte: new Date()
        }
      },
      include: {
        doctor: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    res.json({
      profile: {
        ...profile,
        totalSessionsCompleted: completedSessions,
        totalQuizzesCompleted: completedQuizzes
      },
      recentSessions,
      certifications,
      nextSession,
      stats: {
        completedSessions,
        completedQuizzes,
        certificationsEarned: certifications.filter(c => c.status === 'completed').length,
        progressLevel: Math.floor(completedSessions / 2) + 1
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all sessions
router.get('/sessions', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { status, type } = req.query;

    const whereClause: any = { clientId: userId };
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: { 
            id: true,
            firstName: true, 
            lastName: true,
            doctorProfile: {
              select: { specializations: true }
            }
          }
        },
        quizResult: true
      },
      orderBy: { scheduledAt: 'desc' }
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request human session
router.post('/sessions/request', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { preferredDate, preferredTime, reason, doctorId } = req.body;

    if (!preferredDate || !preferredTime || !reason) {
      return res.status(400).json({ error: 'Preferred date, time, and reason are required' });
    }

    // Create session request (will be approved by admin)
    const scheduledAt = new Date(`${preferredDate}T${preferredTime}`);
    
    const session = await prisma.session.create({
      data: {
        clientId: userId,
        doctorId: doctorId || null,
        type: 'human',
        status: 'scheduled', // Will change to pending-approval if admin approval needed
        scheduledAt,
        topic: reason
      },
      include: {
        doctor: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    res.status(201).json({
      message: 'Session request created successfully',
      session
    });
  } catch (error) {
    console.error('Session request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start AI session
router.post('/sessions/ai', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { topic } = req.body;

    const session = await prisma.session.create({
      data: {
        clientId: userId,
        type: 'ai',
        status: 'in_progress',
        scheduledAt: new Date(),
        startedAt: new Date(),
        topic: topic || 'AI Therapy Session',
        aiModel: 'cohere-command-r-plus'
      }
    });

    res.status(201).json({
      message: 'AI session started successfully',
      session
    });
  } catch (error) {
    console.error('Start AI session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete session and submit quiz
router.post('/sessions/:sessionId/complete', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.params;
    const { quizAnswers, rating, feedback } = req.body;

    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: { 
        id: sessionId,
        clientId: userId 
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        endedAt: new Date(),
        clientRating: rating,
        clientFeedback: feedback
      }
    });

    // Create quiz result if provided
    let quizResult = null;
    if (quizAnswers && quizAnswers.length > 0) {
      const score = calculateQuizScore(quizAnswers);
      quizResult = await prisma.quizResult.create({
        data: {
          sessionId,
          userId,
          questions: quizAnswers.map((q: any) => q.question),
          answers: quizAnswers.map((q: any) => q.answer),
          score,
          totalQuestions: quizAnswers.length
        }
      });
    }

    // Update client profile stats
    await prisma.clientProfile.update({
      where: { userId },
      data: {
        totalSessionsCompleted: { increment: 1 },
        totalQuizzesCompleted: quizResult ? { increment: 1 } : undefined
      }
    });

    // Check for certification progress
    await updateCertificationProgress(userId);

    res.json({
      message: 'Session completed successfully',
      session: updatedSession,
      quizResult
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get progress data
router.get('/progress', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get session stats
    const sessions = await prisma.session.findMany({
      where: { clientId: userId },
      include: { quizResult: true },
      orderBy: { createdAt: 'asc' }
    });

    // Get quiz scores over time
    const quizResults = await prisma.quizResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    // Calculate progress metrics
    const progressData = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      aiSessions: sessions.filter(s => s.type === 'ai').length,
      humanSessions: sessions.filter(s => s.type === 'human').length,
      averageQuizScore: quizResults.length > 0 
        ? quizResults.reduce((sum, q) => sum + q.score, 0) / quizResults.length 
        : 0,
      sessionHistory: sessions.map(s => ({
        date: s.scheduledAt,
        type: s.type,
        status: s.status,
        score: s.quizResult?.score || null
      })),
      quizTrend: quizResults.map(q => ({
        date: q.createdAt,
        score: q.score
      }))
    };

    res.json({ progress: progressData });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available doctors
router.get('/doctors', async (req: AuthenticatedRequest, res) => {
  try {
    // Get all active doctors with their profiles
    const doctors = await prisma.user.findMany({
      where: {
        role: 'doctor',
        isActive: true
      },
      include: {
        doctorProfile: {
          select: {
            licenseNumber: true,
            specializations: true,
            education: true,
            experience: true,
            bio: true,
            workingHours: true,
            sessionDuration: true,
            breakBetweenSessions: true,
            isAvailable: true
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        doctorProfile: true
      }
    });

    // Filter out doctors without complete profiles
    const availableDoctors = doctors.filter(doctor =>
      doctor.doctorProfile &&
      doctor.doctorProfile.licenseNumber &&
      doctor.doctorProfile.specializations.length > 0
    );

    res.json({ doctors: availableDoctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get certifications
router.get('/certifications', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get user certifications
    const userCertifications = await prisma.userCertification.findMany({
      where: { userId },
      include: {
        certification: true
      }
    });

    // Get available certifications
    const availableCertifications = await prisma.certification.findMany();

    // Merge data
    const certifications = availableCertifications.map(cert => {
      const userCert = userCertifications.find(uc => uc.certificationId === cert.id);
      return {
        ...cert,
        userProgress: userCert || null,
        isUnlocked: userCert ? userCert.status !== 'locked' : false,
        progressPercentage: userCert?.progressPercentage || 0
      };
    });

    res.json({ certifications });
  } catch (error) {
    console.error('Get certifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
function calculateQuizScore(quizAnswers: any[]): number {
  // Simple scoring logic - in real app this would be more sophisticated
  const correctAnswers = quizAnswers.filter(q => q.isCorrect).length;
  return Math.round((correctAnswers / quizAnswers.length) * 100);
}

async function updateCertificationProgress(userId: string) {
  try {
    // Get user stats
    const profile = await prisma.clientProfile.findUnique({
      where: { userId }
    });

    if (!profile) return;

    // Check each certification requirement
    const certifications = await prisma.certification.findMany();
    
    for (const cert of certifications) {
      const userCert = await prisma.userCertification.findUnique({
        where: {
          userId_certificationId: {
            userId,
            certificationId: cert.id
          }
        }
      });

      // Calculate progress
      const sessionProgress = Math.min(100, (profile.totalSessionsCompleted / cert.requiredSessions) * 100);
      const quizProgress = Math.min(100, (profile.totalQuizzesCompleted / cert.requiredQuizzes) * 100);
      const overallProgress = Math.min(100, (sessionProgress + quizProgress) / 2);

      if (!userCert) {
        // Create new certification record
        await prisma.userCertification.create({
          data: {
            userId,
            certificationId: cert.id,
            status: overallProgress >= 100 ? 'completed' : 'in_progress',
            progressPercentage: Math.round(overallProgress),
            earnedAt: overallProgress >= 100 ? new Date() : null
          }
        });
      } else if (userCert.status !== 'completed' && overallProgress >= 100) {
        // Update to completed
        await prisma.userCertification.update({
          where: { id: userCert.id },
          data: {
            status: 'completed',
            progressPercentage: 100,
            earnedAt: new Date()
          }
        });
      } else if (userCert.status !== 'completed') {
        // Update progress
        await prisma.userCertification.update({
          where: { id: userCert.id },
          data: {
            progressPercentage: Math.round(overallProgress)
          }
        });
      }
    }
  } catch (error) {
    console.error('Update certification progress error:', error);
  }
}

export default router;
