import express from "express";
import { prisma } from "../lib/prisma";
import {
  authenticateToken,
  requireRole,
  AuthenticatedRequest,
} from "../lib/auth";

const router = express.Router();

// Apply authentication and role check to all routes
router.use(authenticateToken);
router.use(requireRole(["doctor"]));

// Get doctor dashboard data
router.get("/dashboard", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get doctor profile
    const profile = await prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });

    // Get today's sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySessions = await prisma.session.findMany({
      where: {
        doctorId: userId,
        scheduledAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        client: {
          select: { firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    // Get pending session requests
    const pendingRequests = await prisma.session.findMany({
      where: {
        doctorId: userId,
        status: "scheduled",
      },
      include: {
        client: {
          select: { firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get recent session notes
    const recentNotes = await prisma.sessionNote.findMany({
      where: { doctorId: userId },
      include: {
        session: {
          include: {
            client: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Calculate stats
    const totalSessions = await prisma.session.count({
      where: {
        doctorId: userId,
        status: "completed",
      },
    });

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const weekSessions = await prisma.session.count({
      where: {
        doctorId: userId,
        scheduledAt: { gte: thisWeekStart },
      },
    });

    res.json({
      profile,
      todaySessions,
      pendingRequests,
      recentNotes,
      stats: {
        totalSessions,
        weekSessions,
        todaySessionsCount: todaySessions.length,
        pendingRequestsCount: pendingRequests.length,
      },
    });
  } catch (error) {
    console.error("Doctor dashboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all sessions
router.get("/sessions", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { status, date } = req.query;

    const whereClause: any = { doctorId: userId };
    if (status) whereClause.status = status;
    if (date) {
      const queryDate = new Date(date as string);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      whereClause.scheduledAt = {
        gte: queryDate,
        lt: nextDay,
      };
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            clientProfile: {
              select: {
                primaryGoals: true,
                anxietyTriggers: true,
                totalSessionsCompleted: true,
              },
            },
          },
        },
        quizResult: true,
        sessionNotes: true,
      },
      orderBy: { scheduledAt: "desc" },
    });

    res.json({ sessions });
  } catch (error) {
    console.error("Get doctor sessions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start session
router.post(
  "/sessions/:sessionId/start",
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;

      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          doctorId: userId,
        },
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (session.status !== "scheduled") {
        return res.status(400).json({ error: "Session cannot be started" });
      }

      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: "in_progress",
          startedAt: new Date(),
        },
        include: {
          client: {
            select: { firstName: true, lastName: true, avatar: true },
          },
        },
      });

      res.json({
        message: "Session started successfully",
        session: updatedSession,
      });
    } catch (error) {
      console.error("Start session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Update session meeting URL
router.put(
  "/sessions/:sessionId/meeting-url",
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;
      const { meetingUrl } = req.body;

      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          doctorId: userId,
        },
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (!meetingUrl || !meetingUrl.trim()) {
        return res.status(400).json({ error: "Meeting URL is required" });
      }

      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          meetingUrl: meetingUrl.trim(),
        },
        include: {
          client: {
            select: { firstName: true, lastName: true, avatar: true },
          },
        },
      });

      res.json({
        message: "Meeting URL updated successfully",
        session: updatedSession,
      });
    } catch (error) {
      console.error("Update meeting URL error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Complete session
router.post(
  "/sessions/:sessionId/complete",
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;
      const { notes, doctorRating, summary } = req.body;

      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          doctorId: userId,
        },
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: "completed",
          endedAt: new Date(),
          notes,
          doctorRating,
          summary,
        },
      });

      res.json({
        message: "Session completed successfully",
        session: updatedSession,
      });
    } catch (error) {
      console.error("Complete session error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Submit session for admin review
router.post(
  "/sessions/:sessionId/submit-for-review",
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;

      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          doctorId: userId,
        },
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (!session.notes || !session.notes.trim()) {
        return res
          .status(400)
          .json({
            error: "Session must have notes before submitting for review",
          });
      }

      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: "pending_approval", // Update status to indicate admin review needed
        },
      });

      res.json({
        message: "Session submitted for admin review successfully",
        session: updatedSession,
      });
    } catch (error) {
      console.error("Submit session for review error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get schedule/availability
router.get("/schedule", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { week } = req.query;

    // Get doctor profile for working hours
    const profile = await prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    // Calculate week range
    const startDate = week ? new Date(week as string) : new Date();
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // Get sessions for the week
    const sessions = await prisma.session.findMany({
      where: {
        doctorId: userId,
        scheduledAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        client: {
          select: { firstName: true, lastName: true, avatar: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    res.json({
      workingHours: profile.workingHours,
      sessionDuration: profile.sessionDuration,
      breakBetweenSessions: profile.breakBetweenSessions,
      sessions,
      weekStart: startDate,
      weekEnd: endDate,
    });
  } catch (error) {
    console.error("Get schedule error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update availability/working hours
router.put("/schedule", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { workingHours, sessionDuration, breakBetweenSessions } = req.body;

    const updatedProfile = await prisma.doctorProfile.update({
      where: { userId },
      data: {
        workingHours,
        sessionDuration,
        breakBetweenSessions,
      },
    });

    res.json({
      message: "Schedule updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get session notes
router.get("/session-notes", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { clientId, search } = req.query;

    const whereClause: any = { doctorId: userId };
    if (clientId) whereClause.session = { clientId };
    if (search) {
      whereClause.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { content: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const notes = await prisma.sessionNote.findMany({
      where: whereClause,
      include: {
        session: {
          include: {
            client: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ notes });
  } catch (error) {
    console.error("Get session notes error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create session note
router.post("/session-notes", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      sessionId,
      title,
      content,
      tags,
      diagnosis,
      treatmentPlan,
      nextSteps,
    } = req.body;

    if (!sessionId || !title || !content) {
      return res
        .status(400)
        .json({ error: "Session ID, title, and content are required" });
    }

    // Verify session belongs to doctor
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        doctorId: userId,
      },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const note = await prisma.sessionNote.create({
      data: {
        sessionId,
        doctorId: userId,
        title,
        content,
        tags: tags || [],
        diagnosis,
        treatmentPlan,
        nextSteps,
      },
      include: {
        session: {
          include: {
            client: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: "Session note created successfully",
      note,
    });
  } catch (error) {
    console.error("Create session note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update session note
router.put("/session-notes/:noteId", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { noteId } = req.params;
    const { title, content, tags, diagnosis, treatmentPlan, nextSteps } =
      req.body;

    const note = await prisma.sessionNote.findFirst({
      where: {
        id: noteId,
        doctorId: userId,
      },
    });

    if (!note) {
      return res.status(404).json({ error: "Session note not found" });
    }

    const updatedNote = await prisma.sessionNote.update({
      where: { id: noteId },
      data: {
        title,
        content,
        tags,
        diagnosis,
        treatmentPlan,
        nextSteps,
      },
      include: {
        session: {
          include: {
            client: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    res.json({
      message: "Session note updated successfully",
      note: updatedNote,
    });
  } catch (error) {
    console.error("Update session note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get doctor settings/profile
router.get("/settings", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctorProfile: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        doctorProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create doctorProfile if it doesn't exist
    if (!user.doctorProfile) {
      const newDoctorProfile = await prisma.doctorProfile.create({
        data: {
          userId: userId,
          licenseNumber: "",
          specializations: [],
          education: [],
          experience: 0,
          bio: "",
          workingHours: {},
          sessionDuration: 50,
          breakBetweenSessions: 10,
        },
      });

      user.doctorProfile = newDoctorProfile;
    }

    res.json({ user });
  } catch (error) {
    console.error("Get doctor settings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update doctor settings/profile
router.put("/settings", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      firstName,
      lastName,
      phone,
      avatar,
      licenseNumber,
      specializations,
      education,
      experience,
      bio,
    } = req.body;

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        avatar,
      },
    });

    // Update or create doctor profile
    const updatedProfile = await prisma.doctorProfile.upsert({
      where: { userId },
      update: {
        licenseNumber,
        specializations,
        education,
        experience,
        bio,
      },
      create: {
        userId,
        licenseNumber: licenseNumber || "",
        specializations: specializations || [],
        education: education || [],
        experience: experience || 0,
        bio: bio || "",
        workingHours: {},
        sessionDuration: 50,
        breakBetweenSessions: 10,
      },
    });

    res.json({
      message: "Settings updated successfully",
      user: {
        ...updatedUser,
        doctorProfile: updatedProfile,
      },
    });
  } catch (error) {
    console.error("Update doctor settings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
