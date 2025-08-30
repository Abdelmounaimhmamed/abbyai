import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create test users
    console.log('👤 Creating test users...');
    
    // Test client
    const clientUser = await prisma.user.upsert({
      where: { email: 'client@abbyai.com' },
      update: {},
      create: {
        email: 'client@abbyai.com',
        passwordHash: await hashPassword('password123'),
        firstName: 'Emma',
        lastName: 'Client',
        role: 'client',
        isActive: true,
        hasCompletedOnboarding: true,
        dateOfBirth: new Date('1995-06-15'),
        phone: '+1-555-0123',
        clientProfile: {
          create: {
            emergencyContact: 'John Client - +1-555-0124',
            primaryGoals: ['Anxiety Management', 'Stress Reduction'],
            anxietyTriggers: ['Public Speaking', 'Social Situations'],
            preferredTherapyType: ['CBT', 'Mindfulness'],
            previousTherapyExperience: true,
            medicationStatus: 'None',
            totalSessionsCompleted: 3,
            totalQuizzesCompleted: 3,
            progressLevel: 2
          }
        }
      },
      include: { clientProfile: true }
    });

    // Test doctor
    const doctorUser = await prisma.user.upsert({
      where: { email: 'doctor@abbyai.com' },
      update: {},
      create: {
        email: 'doctor@abbyai.com',
        passwordHash: await hashPassword('password123'),
        firstName: 'Dr. Sarah',
        lastName: 'Wilson',
        role: 'doctor',
        isActive: true,
        phone: '+1-555-0125',
        doctorProfile: {
          create: {
            licenseNumber: 'PSY-12345',
            specializations: ['Anxiety Disorders', 'Depression', 'CBT'],
            education: ['PhD Psychology - Harvard University', 'MS Clinical Psychology - Stanford'],
            experience: 8,
            bio: 'Specialized in cognitive behavioral therapy with 8+ years experience helping clients with anxiety and depression.',
            workingHours: {
              monday: { start: '09:00', end: '17:00', isAvailable: true },
              tuesday: { start: '09:00', end: '17:00', isAvailable: true },
              wednesday: { start: '09:00', end: '17:00', isAvailable: true },
              thursday: { start: '09:00', end: '17:00', isAvailable: true },
              friday: { start: '09:00', end: '15:00', isAvailable: true },
              saturday: { start: '10:00', end: '14:00', isAvailable: false },
              sunday: { start: '10:00', end: '14:00', isAvailable: false }
            },
            sessionDuration: 120,
            breakBetweenSessions: 15,
            isApproved: true,
            approvedAt: new Date()
          }
        }
      },
      include: { doctorProfile: true }
    });

    // Test admin
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@abbyai.com' },
      update: {},
      create: {
        email: 'admin@abbyai.com',
        passwordHash: await hashPassword('password123'),
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        phone: '+1-555-0126',
        adminProfile: {
          create: {
            permissions: ['user_management', 'doctor_approval', 'payment_verification', 'certification_approval'],
            lastLogin: new Date()
          }
        }
      },
      include: { adminProfile: true }
    });

    // Create certifications
    console.log('🏆 Creating certifications...');
    const anxietyCert = await prisma.certification.upsert({
      where: { name: 'Anxiety Management Basics' },
      update: {},
      create: {
        name: 'Anxiety Management Basics',
        description: 'Complete fundamental anxiety management techniques and demonstrate understanding through practical application.',
        requirements: {
          sessions: 2,
          quizzes: 2,
          minimumScore: 80
        },
        requiredSessions: 2,
        requiredQuizzes: 2,
        minimumScore: 80,
        badgeImageUrl: '/certifications/anxiety-badge.png'
      }
    });

    const emotionalCert = await prisma.certification.upsert({
      where: { name: 'Emotional Intelligence Explorer' },
      update: {},
      create: {
        name: 'Emotional Intelligence Explorer',
        description: 'Develop emotional awareness and regulation skills through guided therapy sessions.',
        requirements: {
          sessions: 3,
          quizzes: 3,
          minimumScore: 85
        },
        requiredSessions: 3,
        requiredQuizzes: 3,
        minimumScore: 85,
        badgeImageUrl: '/certifications/emotional-badge.png'
      }
    });

    // Create sample sessions
    console.log('💬 Creating sample sessions...');
    const session1 = await prisma.session.create({
      data: {
        clientId: clientUser.id,
        doctorId: doctorUser.id,
        type: 'human',
        status: 'completed',
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000), // 2 hours later
        topic: 'Managing Public Speaking Anxiety',
        summary: 'Discussed CBT techniques for managing anxiety in public speaking situations.',
        clientRating: 5,
        clientFeedback: 'Very helpful session, learned great breathing techniques.',
        doctorRating: 4
      }
    });

    const session2 = await prisma.session.create({
      data: {
        clientId: clientUser.id,
        type: 'ai',
        status: 'completed',
        scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 1.5 hours later
        topic: 'Mindfulness and Stress Reduction',
        aiModel: 'cohere-command-r-plus',
        clientRating: 4,
        clientFeedback: 'AI was very understanding and provided good coping strategies.'
      }
    });

    // Create upcoming session
    const upcomingSession = await prisma.session.create({
      data: {
        clientId: clientUser.id,
        doctorId: doctorUser.id,
        type: 'human',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        topic: 'Follow-up on Anxiety Techniques'
      }
    });

    // Create quiz results
    console.log('📝 Creating quiz results...');
    await prisma.quizResult.create({
      data: {
        sessionId: session1.id,
        userId: clientUser.id,
        questions: [
          'What is the first step in managing anxiety?',
          'Which breathing technique is most effective?',
          'How often should you practice mindfulness?'
        ],
        answers: [0, 1, 2], // Selected answer indices
        score: 85,
        totalQuestions: 3
      }
    });

    await prisma.quizResult.create({
      data: {
        sessionId: session2.id,
        userId: clientUser.id,
        questions: [
          'What is mindfulness?',
          'How long should meditation sessions be?',
          'What are stress reduction benefits?'
        ],
        answers: [0, 2, 1],
        score: 90,
        totalQuestions: 3
      }
    });

    // Create user certifications
    console.log('🏅 Creating user certifications...');
    await prisma.userCertification.create({
      data: {
        userId: clientUser.id,
        certificationId: anxietyCert.id,
        status: 'completed',
        progressPercentage: 100,
        earnedAt: new Date(),
        isApproved: false // Pending admin approval
      }
    });

    await prisma.userCertification.create({
      data: {
        userId: clientUser.id,
        certificationId: emotionalCert.id,
        status: 'in_progress',
        progressPercentage: 67
      }
    });

    // Create session notes
    console.log('📋 Creating session notes...');
    await prisma.sessionNote.create({
      data: {
        sessionId: session1.id,
        doctorId: doctorUser.id,
        title: 'Public Speaking Anxiety - Session 1',
        content: 'Client presented with significant anxiety around public speaking. Discussed cognitive restructuring techniques and breathing exercises. Client responded well to progressive muscle relaxation.',
        tags: ['anxiety', 'CBT', 'breathing techniques', 'public speaking'],
        diagnosis: 'Social Anxiety Disorder (mild to moderate)',
        treatmentPlan: 'Continue CBT approach, practice exposure therapy with gradual public speaking scenarios',
        nextSteps: 'Homework: Practice breathing techniques daily, prepare short presentation for next session'
      }
    });

    // Create payment records
    console.log('💳 Creating payment records...');
    await prisma.payment.create({
      data: {
        userId: clientUser.id,
        amount: 150.00,
        currency: 'USD',
        paymentMethod: 'paypal',
        status: 'completed',
        transactionId: 'PAY-123456789',
        paypalEmail: 'client@abbyai.com',
        isVerified: true,
        verifiedBy: adminUser.id,
        verifiedAt: new Date()
      }
    });

    await prisma.payment.create({
      data: {
        userId: clientUser.id,
        amount: 150.00,
        currency: 'USD',
        paymentMethod: 'bank_transfer',
        status: 'pending',
        bankAccountLast4: '1234',
        isVerified: false
      }
    });

    // Create API keys
    console.log('🔑 Creating API keys...');
    await prisma.aPIKey.create({
      data: {
        name: 'Cohere API Key',
        keyHash: 'abby_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        permissions: ['ai_sessions', 'chat_completion'],
        isActive: true,
        createdBy: adminUser.id,
        usageCount: 45,
        lastUsedAt: new Date()
      }
    });

    console.log('✅ Database seeding completed successfully!');
    console.log('\n🔐 Test Credentials:');
    console.log('👤 Client: client@abbyai.com / password123');
    console.log('👨‍⚕️ Doctor: doctor@abbyai.com / password123');
    console.log('👑 Admin: admin@abbyai.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
