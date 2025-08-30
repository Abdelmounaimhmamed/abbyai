import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole, AuthenticatedRequest, hashPassword } from '../lib/auth';
import crypto from 'crypto';

const router = express.Router();

// Apply authentication and role check to all routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Get admin dashboard stats
router.get('/dashboard', async (req: AuthenticatedRequest, res) => {
  try {
    // Get user counts
    const totalClients = await prisma.user.count({
      where: { role: 'client' }
    });

    const totalDoctors = await prisma.user.count({
      where: { role: 'doctor' }
    });

    const activeSessions = await prisma.session.count({
      where: { status: 'in_progress' }
    });

    const pendingPayments = await prisma.payment.count({
      where: { status: 'pending' }
    });

    const completedSessions = await prisma.session.count({
      where: { status: 'completed' }
    });

    const pendingApprovals = await prisma.userCertification.count({
      where: { 
        status: 'completed',
        isApproved: false 
      }
    });

    // Calculate revenue
    const payments = await prisma.payment.findMany({
      where: { 
        status: 'completed',
        isVerified: true 
      }
    });
    const revenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const certificationsIssued = await prisma.userCertification.count({
      where: { 
        status: 'approved',
        isApproved: true 
      }
    });

    // Get recent activities
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    const recentSessions = await prisma.session.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { firstName: true, lastName: true } },
        doctor: { select: { firstName: true, lastName: true } }
      }
    });

    const pendingPaymentsList = await prisma.payment.findMany({
      where: { status: 'pending' },
      take: 5,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      stats: {
        totalClients,
        totalDoctors,
        activeSessions,
        pendingPayments,
        completedSessions,
        pendingApprovals,
        revenue,
        certificationsIssued
      },
      recentUsers,
      recentSessions,
      pendingPaymentsList
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User management
router.get('/users', async (req: AuthenticatedRequest, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    const whereClause: any = {};
    if (role) whereClause.role = role;
    if (status === 'active') whereClause.isActive = true;
    if (status === 'inactive') whereClause.isActive = false;
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        clientProfile: true,
        doctorProfile: true,
        adminProfile: true,
        _count: {
          select: {
            sessionsAsClient: true,
            sessionsAsDoctor: true,
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.user.count({ where: whereClause });

    const usersWithoutPassword = users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      users: usersWithoutPassword,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user status
router.put('/users/:userId/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Doctor management
router.get('/doctors', async (req: AuthenticatedRequest, res) => {
  try {
    const { approved, search } = req.query;

    const whereClause: any = { role: 'doctor' };
    if (approved === 'true') whereClause.doctorProfile = { isApproved: true };
    if (approved === 'false') whereClause.doctorProfile = { isApproved: false };
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const doctors = await prisma.user.findMany({
      where: whereClause,
      include: {
        doctorProfile: true,
        _count: {
          select: {
            sessionsAsDoctor: {
              where: { status: 'completed' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const doctorsWithoutPassword = doctors.map(doctor => {
      const { passwordHash, ...doctorWithoutPassword } = doctor;
      return doctorWithoutPassword;
    });

    res.json({ doctors: doctorsWithoutPassword });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/reject doctor
router.put('/doctors/:doctorId/approval', async (req: AuthenticatedRequest, res) => {
  try {
    const { doctorId } = req.params;
    const { approved } = req.body;

    const doctor = await prisma.user.findFirst({
      where: { 
        id: doctorId,
        role: 'doctor' 
      },
      include: { doctorProfile: true }
    });

    if (!doctor || !doctor.doctorProfile) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Update doctor approval status
    await prisma.doctorProfile.update({
      where: { userId: doctorId },
      data: {
        isApproved: approved,
        approvedAt: approved ? new Date() : null
      }
    });

    // Activate user if approved
    if (approved) {
      await prisma.user.update({
        where: { id: doctorId },
        data: { isActive: true }
      });
    }

    res.json({
      message: `Doctor ${approved ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Doctor approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payment management
router.get('/payments', async (req: AuthenticatedRequest, res) => {
  try {
    const { status, method, verified } = req.query;

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (method) whereClause.paymentMethod = method;
    if (verified === 'true') whereClause.isVerified = true;
    if (verified === 'false') whereClause.isVerified = false;

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify payment
router.put('/payments/:paymentId/verify', async (req: AuthenticatedRequest, res) => {
  try {
    const { paymentId } = req.params;
    const { verified } = req.body;
    const adminId = req.user!.id;

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        isVerified: verified,
        verifiedBy: verified ? adminId : null,
        verifiedAt: verified ? new Date() : null,
        status: verified ? 'completed' : 'pending'
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    res.json({
      message: `Payment ${verified ? 'verified' : 'rejected'} successfully`,
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export payments report
router.get('/payments/export', async (req: AuthenticatedRequest, res) => {
  try {
    const { format = 'csv', status, method, verified, startDate, endDate } = req.query;

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (method) whereClause.paymentMethod = method;
    if (verified === 'true') whereClause.isVerified = true;
    if (verified === 'false') whereClause.isVerified = false;

    // Date filtering
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = [
        'Payment ID',
        'Client Name',
        'Client Email',
        'Amount',
        'Currency',
        'Payment Method',
        'Status',
        'Transaction ID',
        'Is Verified',
        'Submitted Date',
        'Verified Date',
        'Verified By'
      ].join(',');

      const csvRows = payments.map(payment => [
        payment.id,
        `${payment.user.firstName} ${payment.user.lastName}`,
        payment.user.email,
        payment.amount.toString(),
        payment.currency,
        payment.paymentMethod,
        payment.status,
        payment.transactionId || '',
        payment.isVerified ? 'Yes' : 'No',
        payment.createdAt.toISOString().split('T')[0],
        payment.verifiedAt ? payment.verifiedAt.toISOString().split('T')[0] : '',
        payment.verifiedBy || ''
      ].map(field => `"${field}"`).join(','));

      const csvContent = [csvHeader, ...csvRows].join('\n');

      const filename = `payments_report_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } else {
      // Return JSON format
      res.json({
        payments,
        summary: {
          total: payments.length,
          totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
          verified: payments.filter(p => p.isVerified).length,
          pending: payments.filter(p => p.status === 'pending').length,
          completed: payments.filter(p => p.status === 'completed').length
        },
        generatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Export payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Keys management
router.get('/api-keys', async (req: AuthenticatedRequest, res) => {
  try {
    const apiKeys = await prisma.APIKey.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Hide actual key values, show only preview
    const keysWithPreview = apiKeys.map(key => ({
      ...key,
      keyPreview: `${key.keyHash.substring(0, 8)}...${key.keyHash.substring(key.keyHash.length - 8)}`,
      keyHash: undefined
    }));

    res.json({ apiKeys: keysWithPreview });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create API key
router.post('/api-keys', async (req: AuthenticatedRequest, res) => {
  try {
    const { name, permissions, expiresAt } = req.body;
    const adminId = req.user!.id;

    if (!name) {
      return res.status(400).json({ error: 'API key name is required' });
    }

    // Generate random API key
    const apiKey = `abby_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const createdKey = await prisma.APIKey.create({
      data: {
        name,
        keyHash,
        permissions: permissions || [],
        createdBy: adminId,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    res.status(201).json({
      message: 'API key created successfully',
      apiKey: apiKey, // Only shown once
      keyInfo: {
        ...createdKey,
        keyPreview: `${keyHash.substring(0, 8)}...${keyHash.substring(keyHash.length - 8)}`,
        keyHash: undefined
      }
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update API key
router.put('/api-keys/:keyId', async (req: AuthenticatedRequest, res) => {
  try {
    const { keyId } = req.params;
    const { name, permissions, isActive } = req.body;

    const updatedKey = await prisma.APIKey.update({
      where: { id: keyId },
      data: {
        name,
        permissions,
        isActive
      }
    });

    res.json({
      message: 'API key updated successfully',
      keyInfo: {
        ...updatedKey,
        keyPreview: `${updatedKey.keyHash.substring(0, 8)}...${updatedKey.keyHash.substring(updatedKey.keyHash.length - 8)}`,
        keyHash: undefined
      }
    });
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete API key
router.delete('/api-keys/:keyId', async (req: AuthenticatedRequest, res) => {
  try {
    const { keyId } = req.params;

    await prisma.APIKey.delete({
      where: { id: keyId }
    });

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create doctor
router.post('/doctors', async (req: AuthenticatedRequest, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      licenseNumber,
      specializations,
      education,
      experience,
      bio,
      phone
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !licenseNumber) {
      return res.status(400).json({
        error: 'Email, first name, last name, and license number are required'
      });
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if license number already exists
    const existingLicense = await prisma.doctorProfile.findUnique({
      where: { licenseNumber }
    });

    if (existingLicense) {
      return res.status(400).json({ error: 'License number already exists' });
    }

    // Generate temporary password (should be sent via email in production)
    const tempPassword = crypto.randomBytes(12).toString('hex');
    const passwordHash = await hashPassword(tempPassword);

    // Default working hours
    const defaultWorkingHours = {
      monday: { start: "09:00", end: "17:00", isAvailable: true },
      tuesday: { start: "09:00", end: "17:00", isAvailable: true },
      wednesday: { start: "09:00", end: "17:00", isAvailable: true },
      thursday: { start: "09:00", end: "17:00", isAvailable: true },
      friday: { start: "09:00", end: "17:00", isAvailable: true },
      saturday: { start: "09:00", end: "13:00", isAvailable: false },
      sunday: { start: "09:00", end: "13:00", isAvailable: false }
    };

    // Create user and doctor profile in a transaction
    const doctor = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          firstName,
          lastName,
          role: 'doctor',
          passwordHash,
          phone: phone || null,
          isActive: false // Will be activated after approval
        }
      });

      const doctorProfile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          licenseNumber,
          specializations: specializations || [],
          education: education || [],
          experience: parseInt(experience) || 0,
          bio: bio || null,
          workingHours: defaultWorkingHours,
          isApproved: false
        }
      });

      return {
        ...user,
        doctorProfile
      };
    });

    // Remove password hash from response
    const { passwordHash: _, ...doctorWithoutPassword } = doctor;

    res.status(201).json({
      message: 'Doctor created successfully',
      doctor: doctorWithoutPassword,
      tempPassword // In production, this should be sent via email
    });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Certification management
router.get('/certifications', async (req: AuthenticatedRequest, res) => {
  try {
    const { status, pending } = req.query;

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (pending === 'true') {
      whereClause.status = 'completed';
      whereClause.isApproved = false;
    }

    const certifications = await prisma.userCertification.findMany({
      where: whereClause,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        },
        certification: true
      },
      orderBy: { earnedAt: 'desc' }
    });

    res.json({ certifications });
  } catch (error) {
    console.error('Get certifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve certification
router.put('/certifications/:certificationId/approve', async (req: AuthenticatedRequest, res) => {
  try {
    const { certificationId } = req.params;
    const { approved } = req.body;
    const adminId = req.user!.id;

    const updatedCertification = await prisma.userCertification.update({
      where: { id: certificationId },
      data: {
        isApproved: approved,
        approvedBy: approved ? adminId : null,
        approvedAt: approved ? new Date() : null,
        status: approved ? 'approved' : 'completed'
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        certification: true
      }
    });

    res.json({
      message: `Certification ${approved ? 'approved' : 'rejected'} successfully`,
      certification: updatedCertification
    });
  } catch (error) {
    console.error('Approve certification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create initial certifications (setup)
router.post('/certifications/setup', async (req: AuthenticatedRequest, res) => {
  try {
    const defaultCertifications = [
      {
        name: 'Anxiety Management Basics',
        description: 'Complete fundamental anxiety management techniques and demonstrate understanding through practical application.',
        requirements: ['Complete 2 therapy sessions', 'Pass 2 quizzes with 80% score'],
        requiredSessions: 2,
        requiredQuizzes: 2,
        minimumScore: 80
      },
      {
        name: 'Emotional Intelligence Explorer',
        description: 'Develop emotional awareness and regulation skills through guided therapy sessions.',
        requirements: ['Complete 3 therapy sessions', 'Pass 3 quizzes with 85% score'],
        requiredSessions: 3,
        requiredQuizzes: 3,
        minimumScore: 85
      },
      {
        name: 'Mindfulness Practitioner',
        description: 'Master mindfulness techniques and meditation practices for mental well-being.',
        requirements: ['Complete 4 therapy sessions', 'Pass 4 quizzes with 80% score'],
        requiredSessions: 4,
        requiredQuizzes: 4,
        minimumScore: 80
      }
    ];

    const createdCertifications = [];
    for (const cert of defaultCertifications) {
      const existing = await prisma.certification.findFirst({
        where: { name: cert.name }
      });

      if (!existing) {
        const created = await prisma.certification.create({
          data: cert
        });
        createdCertifications.push(created);
      }
    }

    res.json({
      message: 'Default certifications created successfully',
      certifications: createdCertifications
    });
  } catch (error) {
    console.error('Setup certifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin settings
router.get('/settings', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminProfile: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        adminProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
