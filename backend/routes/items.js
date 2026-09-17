const express = require('express');
const router = express.Router();
const Pusher = require('pusher');
const Item = require('../models/Item');
const Config = require('../models/Config');
const User = require('../models/User');
const { auth, checkRole } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const { validateFinePayload } = require('../utils/validation');

const PRINCIPAL_PD_USERNAME = 'PD';
const OBJECT_ID_ROUTE = '/:id([0-9a-fA-F]{24})';
const MAX_FINE_VALUE = 999999;
const ACTIVE_CYCLE_QUERY = {
  $or: [
    { cycleClosedAt: null },
    { cycleClosedAt: { $exists: false } },
  ],
};
const belongsToVerifiedUser = (item) => item.userId?.emailVerified === true;
const isFineForVerifiedUser = async (item) => {
  if (!item?.userId) return false;
  return Boolean(await User.exists({ _id: item.userId, emailVerified: true }));
};

function getPusher() {
  return new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });
}

const isActingPDUpdatingOwnFine = async (req, item) => {
  if (req.user.role !== 'pd' || item.userId.toString() !== req.user.id) {
    return false;
  }

  const requester = await User.findById(req.user.id);
  return requester?.username !== PRINCIPAL_PD_USERNAME;
};

const isPrincipalPD = async (user) => {
  const requester = await User.findById(user.id);
  return requester?.username === PRINCIPAL_PD_USERNAME && requester?.role === 'pd';
};

// GET all fines - shared dashboard view for all authenticated users
router.get('/', auth, async (req, res) => {
  try {
    const items = await Item.find(ACTIVE_CYCLE_QUERY).populate('userId', 'username emailVerified');
    res.json(req.user.role === 'pd' ? items.filter(belongsToVerifiedUser) : items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET previous fine cycles - PD only
router.get('/previous-cycles', [auth, checkRole('pd')], async (req, res) => {
  try {
    const closedFines = await Item.find({ cycleClosedAt: { $ne: null } })
      .populate('userId', 'username emailVerified')
      .populate('cycleClosedBy', 'username')
      .sort({ cycleClosedAt: -1, date: -1 });

    const cyclesByDate = closedFines.filter(belongsToVerifiedUser).reduce((cycles, fine) => {
      const dateKey = fine.cycleClosedAt.toISOString().split('T')[0];

      if (!cycles[dateKey]) {
        cycles[dateKey] = {
          date: dateKey,
          startDate: fine.date,
          closedAt: fine.cycleClosedAt,
          closedBy: fine.cycleClosedBy?.username || 'PD',
          totalFines: 0,
          totalAmount: 0,
          fines: [],
        };
      }

      if (fine.date && new Date(fine.date) < new Date(cycles[dateKey].startDate)) {
        cycles[dateKey].startDate = fine.date;
      }

      cycles[dateKey].totalFines += 1;
      cycles[dateKey].totalAmount += fine.value;
      cycles[dateKey].fines.push(fine);
      return cycles;
    }, {});

    res.json(Object.values(cyclesByDate));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single fine by ID
router.get(OBJECT_ID_ROUTE, auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('userId', 'username emailVerified');
    if (!item) return res.status(404).json({ message: 'Fine not found' });
    if (item.cycleClosedAt) return res.status(404).json({ message: 'Fine not found in current cycle' });
    if (req.user.role === 'pd' && !belongsToVerifiedUser(item)) {
      return res.status(404).json({ message: 'Fine not found' });
    }

    // Check authorization: PD can view any, employees only their own
    if (req.user.role !== 'pd' && item.userId?._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to view this fine' });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE fine - PD only
router.post('/', [auth, checkRole('pd')], async (req, res) => {
  const validation = validateFinePayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const item = new Item({
    userId: validation.normalized.userId,
    name: validation.normalized.name,
    description: validation.normalized.description,
    category: validation.normalized.category,
    value: validation.normalized.value,
    status: req.body.status || 'pending',
  });

  try {
    const employee = await User.findById(validation.normalized.userId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (!employee.isActive) {
      return res.status(400).json({ message: 'Cannot create a fine for a removed employee' });
    }

    if (!employee.emailVerified) {
      return res.status(400).json({ message: 'Cannot create a fine until the employee verifies their email' });
    }

    if (employee.role === 'pd') {
      return res.status(400).json({ message: 'Project Directors cannot be fined' });
    }

    const savedItem = await item.save();

    try {
      getPusher().trigger(`user-${employee._id}`, 'new-fine', savedItem);
    } catch (pusherErr) {
      console.warn('⚠️ Fine notification not sent:', pusherErr.message);
    }
    
    // Send email notification to employee (email service will handle if not configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        if (employee && employee.email) {
          const pdName = req.user.username || 'Project Director';
          const subject = `⚠️ Fine ho giya apko - $${item.value}`;
          const message = `
         
           
             <h2>New Fine </h2>
            <p>Hello ${employee.username},</p>
            <p>A new fine has been assigned to you by <strong>${pdName}</strong>.</p>
            <div style="border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; background-color: #fef2f2;">
              <p><strong>Category:</strong> ${item.category}</p>
              <p><strong>Amount:</strong> $${item.value}</p>
              <p><strong>Description:</strong> ${item.description || 'N/A'}</p>
              <p><strong>Status:</strong> ${item.status}</p>
            </div>
            <p>Please log in to your dashboard to view more details.</p>
            <p>Best regards,<br>FineMate</p>
          `;
          await sendEmail(employee.email, subject, message);
        }
      } catch (emailErr) {
        console.warn('⚠️  Email not sent:', emailErr.message);
        // Don't fail the API call if email fails
      }
    }
    
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE fine - PD only
router.put(OBJECT_ID_ROUTE, [auth, checkRole('pd')], async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Fine not found' });
    if (item.cycleClosedAt) return res.status(400).json({ message: 'Previous cycle fines cannot be edited' });
    if (!(await isFineForVerifiedUser(item))) return res.status(404).json({ message: 'Fine not found' });

    if (await isActingPDUpdatingOwnFine(req, item)) {
      return res.status(403).json({ message: 'Acting Project Directors cannot edit their own fines' });
    }

    // Update allowed fields
    if (req.body.name) item.name = req.body.name;
    if (req.body.description) item.description = req.body.description;
    if (req.body.category) item.category = req.body.category;
    if (req.body.value !== undefined) {
      if (req.body.value <= 0) {
        return res.status(400).json({ message: 'Fine value must be positive' });
      }
      if (req.body.value > MAX_FINE_VALUE) {
        return res.status(400).json({ message: 'Fine value cannot exceed 6 digits' });
      }
      item.value = req.body.value;
    }
    if (req.body.status) item.status = req.body.status;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const closeFineCycle = async (req, res) => {
  try {
    // Verify that only Principal PD can perform this action
    if (!(await isPrincipalPD(req.user))) {
      return res.status(403).json({
        message: 'Only the Principal Project Director can close the fine cycle'
      });
    }

    // Check if there are any pending fines
    const pendingFines = await Item.find({ ...ACTIVE_CYCLE_QUERY, status: 'pending' });
    if (pendingFines.length > 0) {
      return res.status(400).json({
        message: `Cannot close fine cycle: ${pendingFines.length} pending fine(s) found. All fines must be marked as paid before closing.`
      });
    }

    const activeFineCount = await Item.countDocuments(ACTIVE_CYCLE_QUERY);
    if (activeFineCount === 0) {
      return res.status(400).json({ message: 'There are no fines in the current cycle.' });
    }

    const cycleClosedAt = new Date();
    const updateResult = await Item.updateMany(ACTIVE_CYCLE_QUERY, {
      $set: {
        cycleClosedAt,
        cycleClosedBy: req.user.id,
      },
    });

    console.log(`[CYCLE] Principal PD closed fine cycle. Moved ${updateResult.modifiedCount} fines to previous cycles.`);

    // Move current cycle amountUsed into allTimeAmountUsed and reset amountUsed
    try {
      const amountUsedConfig = await Config.findOne({ key: 'amountUsed' });
      const allTimeConfig = await Config.findOne({ key: 'allTimeAmountUsed' });

      const amountUsedValue = Number(amountUsedConfig?.value || 0);
      if (amountUsedValue > 0) {
        if (!allTimeConfig) {
          const c = new Config({ key: 'allTimeAmountUsed', value: amountUsedValue, updatedBy: req.user.id });
          await c.save();
        } else {
          allTimeConfig.value = Number(allTimeConfig.value || 0) + amountUsedValue;
          allTimeConfig.updatedBy = req.user.id;
          allTimeConfig.updatedAt = new Date();
          await allTimeConfig.save();
        }

        // reset current amountUsed to 0
        if (amountUsedConfig) {
          amountUsedConfig.value = 0;
          amountUsedConfig.updatedBy = req.user.id;
          amountUsedConfig.updatedAt = new Date();
          await amountUsedConfig.save();
        }
      }
    } catch (cfgErr) {
      console.warn('[CYCLE] Failed to update all-time amount used:', cfgErr.message);
      // don't block cycle closing on config errors
    }

    res.json({
      message: `Fine cycle closed successfully. Moved ${updateResult.modifiedCount} fines to Previous Fine Cycles.`,
      closedCount: updateResult.modifiedCount,
      cycleClosedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CLOSE CYCLE - Move paid current-cycle fines to Previous Fine Cycles (Principal PD only)
router.post('/close-cycle', [auth, checkRole('pd')], closeFineCycle);

// DELETE fine - PD only
router.delete(OBJECT_ID_ROUTE, [auth, checkRole('pd')], async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Fine not found' });
    if (item.cycleClosedAt) return res.status(400).json({ message: 'Previous cycle fines cannot be deleted' });
    if (!(await isFineForVerifiedUser(item))) return res.status(404).json({ message: 'Fine not found' });

    if (await isActingPDUpdatingOwnFine(req, item)) {
      return res.status(403).json({ message: 'Acting Project Directors cannot delete their own fines' });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Fine deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE previous fine cycle by date (PD only)
router.delete('/cycles/:date', [auth, checkRole('pd')], async (req, res) => {
  try {
    // Only Principal PD may delete a previous cycle
    if (!(await isPrincipalPD(req.user))) {
      return res.status(403).json({ message: 'Only the Principal Project Director can delete previous cycles' });
    }
    const dateStr = req.params.date; // expected YYYY-MM-DD
    const start = new Date(dateStr);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid date' });
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const result = await Item.deleteMany({
      cycleClosedAt: { $gte: start, $lt: end }
    });

    return res.json({ message: `Deleted ${result.deletedCount} fines from cycle ${dateStr}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
