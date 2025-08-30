import express from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword, generateToken, authenticateToken, AuthenticatedRequest } from '../lib/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'client', dateOfBirth } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role as UserRole,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        isActive: role === 'client', // Auto-activate clients, doctors/admins need approval
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // Create role-specific profile
    if (role === 'client') {
      await prisma.clientProfile.create({
        data: {
          userId: user.id,
        }
      });
    } else if (role === 'doctor') {
      await prisma.doctorProfile.create({
        data: {
          userId: user.id,
          licenseNumber: '', // To be filled later
          specializations: [],
          education: [],
          experience: 0,
          workingHours: {},
        }
      });
    } else if (role === 'admin') {
      await prisma.adminProfile.create({
        data: {
          userId: user.id,
          permissions: [],
        }
      });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        clientProfile: true,
        doctorProfile: true,
        adminProfile: true,
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is pending activation. Please contact an administrator.' });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Prepare user data (exclude password hash)
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      avatar: user.avatar,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      profile: user.role === 'client' ? user.clientProfile : 
               user.role === 'doctor' ? user.doctorProfile : 
               user.adminProfile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        clientProfile: true,
        doctorProfile: true,
        adminProfile: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatar: true,
        phone: true,
        dateOfBirth: true,
        hasCompletedOnboarding: true,
        clientProfile: true,
        doctorProfile: true,
        adminProfile: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = {
      ...user,
      profile: user.role === 'client' ? user.clientProfile : 
               user.role === 'doctor' ? user.doctorProfile : 
               user.adminProfile
    };

    res.json({ user: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { firstName, lastName, phone, avatar, ...profileData } = req.body;

    // Update basic user info
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        firstName,
        lastName,
        phone,
        avatar,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatar: true,
        phone: true,
        dateOfBirth: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Update role-specific profile
    let profile = null;
    if (req.user!.role === 'client' && profileData) {
      profile = await prisma.clientProfile.update({
        where: { userId: req.user!.id },
        data: profileData
      });
    } else if (req.user!.role === 'doctor' && profileData) {
      profile = await prisma.doctorProfile.update({
        where: { userId: req.user!.id },
        data: profileData
      });
    } else if (req.user!.role === 'admin' && profileData) {
      profile = await prisma.adminProfile.update({
        where: { userId: req.user!.id },
        data: profileData
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: { ...updatedUser, profile }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete onboarding
router.post('/onboarding', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const onboardingData = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    console.log('Onboarding request:', {
      userId,
      userRole,
      hasData: !!onboardingData,
      dataKeys: Object.keys(onboardingData || {})
    });

    // Validate input data
    if (!onboardingData) {
      return res.status(400).json({ error: 'Onboarding data is required' });
    }

    // Update user onboarding status
    await prisma.user.update({
      where: { id: userId },
      data: { hasCompletedOnboarding: true }
    });

    let updatedProfile = null;

    if (userRole === 'client') {
      // Update client profile with onboarding data
      updatedProfile = await prisma.clientProfile.update({
        where: { userId },
        data: {
          emergencyContact: onboardingData.emergencyContact,
          primaryGoals: onboardingData.primaryGoals || [],
          anxietyTriggers: onboardingData.anxietyTriggers || [],
          preferredTherapyType: onboardingData.preferredTherapyType || [],
          previousTherapyExperience: onboardingData.previousTherapyExperience || false,
          medicationStatus: onboardingData.medicationStatus,
        }
      });
    } else if (userRole === 'doctor' && onboardingData.doctorProfile) {
      // Update doctor profile with onboarding data
      const doctorData = onboardingData.doctorProfile;

      // Validate required fields
      if (!doctorData.licenseNumber || !doctorData.licenseNumber.trim()) {
        return res.status(400).json({ error: 'License number is required' });
      }

      try {
        // Use upsert to handle cases where profile might not exist
        updatedProfile = await prisma.doctorProfile.upsert({
          where: { userId },
          update: {
            licenseNumber: doctorData.licenseNumber.trim(),
            specializations: doctorData.specializations || [],
            education: doctorData.education || [],
            experience: doctorData.experience || 0,
            bio: doctorData.bio || null,
            workingHours: doctorData.workingHours || {},
            sessionDuration: doctorData.sessionDuration || 60,
            breakBetweenSessions: doctorData.breakBetweenSessions || 15,
            isAvailable: true
          },
          create: {
            userId,
            licenseNumber: doctorData.licenseNumber.trim(),
            specializations: doctorData.specializations || [],
            education: doctorData.education || [],
            experience: doctorData.experience || 0,
            bio: doctorData.bio || null,
            workingHours: doctorData.workingHours || {},
            sessionDuration: doctorData.sessionDuration || 60,
            breakBetweenSessions: doctorData.breakBetweenSessions || 15,
            isAvailable: true
          }
        });
      } catch (profileError) {
        console.error('Doctor profile update error:', profileError);
        // Check if it's a unique constraint violation
        if (profileError.code === 'P2002') {
          return res.status(400).json({
            error: 'License number already exists. Please use a different license number.'
          });
        }
        throw profileError; // Re-throw if it's not a constraint violation
      }
    }

    res.json({
      message: 'Onboarding completed successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Onboarding error:', error);

    // Provide more specific error messages
    if (error.code === 'P2002') {
      res.status(400).json({
        error: 'Duplicate data found. Please check your license number or other unique fields.'
      });
    } else if (error.code === 'P2025') {
      res.status(404).json({
        error: 'User profile not found. Please contact support.'
      });
    } else if (error.message && error.message.includes('validation')) {
      res.status(400).json({
        error: `Validation error: ${error.message}`
      });
    } else {
      res.status(500).json({
        error: 'Failed to complete onboarding. Please try again or contact support.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

export default router;
