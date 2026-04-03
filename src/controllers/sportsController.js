// ==================== SPORTS CONTROLLER ====================
//
// Mô tả: Xử lý logic cho Sports module (Leagues, Matches, Events, Highlights...)
// Sử dụng: const sportsController = require('../controllers/sportsController');
//

const League = require('../models/League');
const Team = require('../models/Team');
const Match = require('../models/Match');
const Event = require('../models/Event');
const Highlight = require('../models/Highlight');
const { HTTP_STATUS, MESSAGES, PAGINATION } = require('../config/constants');
const { sendSuccess, sendError, sendPaginatedSuccess } = require('../utils/responseHandler');

// ==================== LEAGUE ENDPOINTS ====================

/**
 * GET /api/sports/leagues
 * Lấy danh sách tất cả giải đấu
 * @access Public
 */
exports.getLeagues = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const status = req.query.status;

    // Build filter
    const filter = {};
    if (status) {
      filter.status = status; // 'active', 'upcoming', 'finished'
    }

    // Get total count
    const total = await League.countDocuments(filter);

    // Fetch leagues with pagination
    const leagues = await League.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ season: -1, createdAt: -1 });

    const totalPages = Math.ceil(total / limit);

    return sendPaginatedSuccess(
      res,
      leagues,
      {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      'Lấy danh sách giải đấu thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sports/leagues/:id
 * Lấy chi tiết 1 giải đấu
 * @access Public
 */
exports.getLeagueById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const league = await League.findById(id)
      .populate('teams')
      .populate({
        path: 'matches',
        populate: [
          { path: 'homeTeamId', select: 'name logo' },
          { path: 'awayTeamId', select: 'name logo' },
        ],
      });

    if (!league) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Giải đấu không tồn tại'
      );
    }

    // Get statistics
    const stats = {
      totalMatches: league.matches.length,
      finishedMatches: league.matches.filter(m => m.status === 'finished').length,
      upcomingMatches: league.matches.filter(m => m.status === 'upcoming').length,
      liveMatches: league.matches.filter(m => m.status === 'live').length,
    };

    return sendSuccess(
      res,
      { ...league.toObject(), stats },
      'Lấy chi tiết giải đấu thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sports/admin/leagues
 * Tạo giải đấu mới (Chỉ Admin)
 * @access Admin
 */
exports.createLeague = async (req, res, next) => {
  try {
    const { name, code, description, logo, country, season, matchesPerSeason, startDate, endDate } = req.body;

    // Validation
    if (!name || !code || !country || !season) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Vui lòng cung cấp đầy đủ thông tin bắt buộc'
      );
    }

    // Check duplicate
    const existingLeague = await League.findOne({ $or: [{ name }, { code }] });
    if (existingLeague) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        'Giải đấu hoặc code đã tồn tại'
      );
    }

    // Create slug
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const league = await League.create({
      name,
      slug,
      code: code.toUpperCase(),
      description,
      logo,
      country,
      season,
      matchesPerSeason,
      startDate,
      endDate,
      status: 'upcoming',
    });

    return sendSuccess(
      res,
      league,
      'Tạo giải đấu thành công',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/sports/admin/leagues/:id
 * Cập nhật giải đấu (Chỉ Admin)
 * @access Admin
 */
exports.updateLeague = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, logo, status, startDate, endDate } = req.body;

    const league = await League.findById(id);
    if (!league) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Giải đấu không tồn tại'
      );
    }

    // Update fields
    if (name) league.name = name;
    if (description) league.description = description;
    if (logo) league.logo = logo;
    if (status) league.status = status;
    if (startDate) league.startDate = startDate;
    if (endDate) league.endDate = endDate;

    const updated = await league.save();

    return sendSuccess(
      res,
      updated,
      'Cập nhật giải đấu thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/sports/admin/leagues/:id
 * Xóa giải đấu (Chỉ Admin)
 * @access Admin
 */
exports.deleteLeague = async (req, res, next) => {
  try {
    const { id } = req.params;

    const league = await League.findByIdAndDelete(id);
    if (!league) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Giải đấu không tồn tại'
      );
    }

    return sendSuccess(
      res,
      { _id: id },
      'Xóa giải đấu thành công'
    );
  } catch (error) {
    next(error);
  }
};

// ==================== MATCH ENDPOINTS ====================

/**
 * GET /api/sports/matches
 * Lấy danh sách trận đấu
 * @access Public
 */
exports.getMatches = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const status = req.query.status;
    const leagueId = req.query.leagueId;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (leagueId) filter.leagueId = leagueId;

    const total = await Match.countDocuments(filter);

    const matches = await Match.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ scheduleDate: -1 })
      .select('-possession -shots -shotsOnTarget -passes -stats');

    const totalPages = Math.ceil(total / limit);

    return sendPaginatedSuccess(
      res,
      matches,
      {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      'Lấy danh sách trận đấu thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sports/matches/upcoming
 * Lấy trận đấu sắp tới (tối đa 10)
 * @access Public
 */
exports.getUpcomingMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ status: 'upcoming' })
      .limit(10)
      .sort({ scheduleDate: 1 })
      .select('-possession -shots -shotsOnTarget -passes -stats');

    return sendSuccess(
      res,
      matches,
      'Lấy trận đấu sắp tới thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sports/matches/live
 * Lấy trận đấu đang trực tiếp
 * @access Public
 */
exports.getLiveMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ status: 'live', isLive: true })
      .select('-possession -shots -shotsOnTarget -passes -stats');

    return sendSuccess(
      res,
      matches,
      'Lấy trận đấu đang trực tiếp thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sports/matches/:id
 * Lấy chi tiết trận đấu
 * @access Public
 */
exports.getMatchById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const match = await Match.findById(id)
      .populate('leagueId', 'name code')
      .populate('homeTeamId', 'name logo')
      .populate('awayTeamId', 'name logo')
      .populate('highlightId');

    if (!match) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Trận đấu không tồn tại'
      );
    }

    // Increment view count
    match.viewCount++;
    await match.save();

    return sendSuccess(
      res,
      match,
      'Lấy chi tiết trận đấu thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sports/admin/matches
 * Tạo trận đấu mới (Chỉ Admin)
 * @access Admin
 */
exports.createMatch = async (req, res, next) => {
  try {
    const { leagueId, homeTeamId, awayTeamId, scheduleDate, scheduleTime, round, stadium, description } = req.body;

    // Validation
    if (!leagueId || !homeTeamId || !awayTeamId || !scheduleDate || !scheduleTime) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Vui lòng cung cấp đầy đủ thông tin bắt buộc'
      );
    }

    // Get team info
    const homeTeam = await Team.findById(homeTeamId);
    const awayTeam = await Team.findById(awayTeamId);

    if (!homeTeam || !awayTeam) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Đội bóng không tồn tại'
      );
    }

    const match = await Match.create({
      leagueId,
      homeTeamId,
      awayTeamId,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      homeTeamLogo: homeTeam.logo,
      awayTeamLogo: awayTeam.logo,
      scheduleDate,
      scheduleTime,
      round,
      stadium,
      description,
      status: 'upcoming',
    });

    return sendSuccess(
      res,
      match,
      'Tạo trận đấu thành công',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/sports/admin/matches/:id/score
 * Cập nhật tỉ số trận đấu
 * @access Admin
 */
exports.updateMatchScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { homeScore, awayScore, status } = req.body;

    // Validation
    if (homeScore === undefined || awayScore === undefined) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Vui lòng cung cấp tỉ số'
      );
    }

    const match = await Match.findById(id);
    if (!match) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Trận đấu không tồn tại'
      );
    }

    match.homeScore = homeScore;
    match.awayScore = awayScore;
    if (status) match.status = status;
    if (status === 'finished') match.isLive = false;

    const updated = await match.save();

    return sendSuccess(
      res,
      updated,
      'Cập nhật tỉ số thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/sports/admin/matches/:id
 * Xóa trận đấu
 * @access Admin
 */
exports.deleteMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const match = await Match.findByIdAndDelete(id);
    if (!match) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Trận đấu không tồn tại'
      );
    }

    return sendSuccess(
      res,
      { _id: id },
      'Xóa trận đấu thành công'
    );
  } catch (error) {
    next(error);
  }
};

// ==================== EVENT ENDPOINTS ====================

/**
 * GET /api/sports/events
 * Lấy danh sách sự kiện
 * @access Public
 */
exports.getEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const type = req.query.type;

    const filter = {};
    if (type) filter.type = type;

    const total = await Event.countDocuments(filter);

    const events = await Event.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ eventDate: -1 });

    const totalPages = Math.ceil(total / limit);

    return sendPaginatedSuccess(
      res,
      events,
      {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      'Lấy danh sách sự kiện thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sports/events/live
 * Lấy sự kiện đang trực tiếp
 * @access Public
 */
exports.getLiveEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ isLive: true, status: 'live' })
      .limit(5)
      .sort({ eventDate: -1 });

    return sendSuccess(
      res,
      events,
      'Lấy sự kiện đang trực tiếp thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sports/events/:id
 * Lấy chi tiết sự kiện
 * @access Public
 */
exports.getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate('matchId')
      .populate('leagueId', 'name code');

    if (!event) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Sự kiện không tồn tại'
      );
    }

    return sendSuccess(
      res,
      event,
      'Lấy chi tiết sự kiện thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sports/admin/events
 * Tạo sự kiện (Chỉ Admin)
 * @access Admin
 */
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, postImage, eventDate, eventTime, matchId, leagueId, type, tags } = req.body;

    if (!title || !eventDate || !eventTime) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Vui lòng cung cấp đầy đủ thông tin bắt buộc'
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const event = await Event.create({
      title,
      slug,
      description,
      postImage,
      eventDate,
      eventTime,
      matchId,
      leagueId,
      type: type || 'upcoming',
      status: 'coming_soon',
      tags,
    });

    return sendSuccess(
      res,
      event,
      'Tạo sự kiện thành công',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/sports/admin/events/:id
 * Xóa sự kiện
 * @access Admin
 */
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Sự kiện không tồn tại'
      );
    }

    return sendSuccess(
      res,
      { _id: id },
      'Xóa sự kiện thành công'
    );
  } catch (error) {
    next(error);
  }
};

// ==================== HIGHLIGHT ENDPOINTS ====================

/**
 * GET /api/sports/highlights
 * Lấy danh sách video highlight
 * @access Public
 */
exports.getHighlights = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const sort = req.query.sort || 'newest'; // newest, mostViewed, trending
    const leagueId = req.query.leagueId;

    const filter = { isPublished: true };
    if (leagueId) filter.leagueId = leagueId;

    let sortOption = { uploadedDate: -1 };
    if (sort === 'mostViewed') sortOption = { viewCount: -1 };
    if (sort === 'trending') sortOption = { likes: -1 };

    const total = await Highlight.countDocuments(filter);

    const highlights = await Highlight.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sortOption)
      .select('title slug thumbnailImage duration uploadedDate viewCount likes leagueId createdAt');

    const totalPages = Math.ceil(total / limit);

    return sendPaginatedSuccess(
      res,
      highlights,
      {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      'Lấy danh sách video highlight thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sports/highlights/trending
 * Lấy video nổi bật nhất
 * @access Public
 */
exports.getTrendingHighlights = async (req, res, next) => {
  try {
    const highlights = await Highlight.find({ isPublished: true })
      .limit(10)
      .sort({ likes: -1, viewCount: -1 })
      .select('title slug thumbnailImage duration uploadedDate viewCount likes');

    return sendSuccess(
      res,
      highlights,
      'Lấy video nổi bật thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/sports/highlights/:id
 * Lấy chi tiết video highlight
 * @access Public
 */
exports.getHighlightById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check VIP requirement
    const isVip = req.user && req.user.subscription?.plan === 'vip';

    const highlight = await Highlight.findById(id)
      .populate('leagueId', 'name code')
      .populate('matchId');

    if (!highlight) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Video highlight không tồn tại'
      );
    }

    if (highlight.isVip && !isVip) {
      return sendError(
        res,
        HTTP_STATUS.FORBIDDEN,
        'Video này yêu cầu gói VIP'
      );
    }

    // Increment view count
    await highlight.incrementViewCount();

    return sendSuccess(
      res,
      {
        ...highlight.toObject(),
        durationFormatted: highlight.getFormattedDuration(),
      },
      'Lấy chi tiết video highlight thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sports/highlights/:id/like
 * Like video highlight
 * @access Protected
 */
exports.likeHighlight = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const highlight = await Highlight.findById(id);
    if (!highlight) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Video highlight không tồn tại'
      );
    }

    await highlight.addLike(userId);

    return sendSuccess(
      res,
      { likes: highlight.likes },
      'Like video thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sports/highlights/:id/unlike
 * Unlike video highlight
 * @access Protected
 */
exports.unlikeHighlight = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const highlight = await Highlight.findById(id);
    if (!highlight) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Video highlight không tồn tại'
      );
    }

    await highlight.removeLike(userId);

    return sendSuccess(
      res,
      { likes: highlight.likes },
      'Unlike video thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sports/admin/highlights
 * Tạo highlight (Chỉ Admin)
 * @access Admin
 */
exports.createHighlight = async (req, res, next) => {
  try {
    const { title, description, videoUrl, thumbnailImage, duration, matchId, leagueId, goals, isVip } = req.body;

    if (!title || !videoUrl || !duration || !leagueId) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Vui lòng cung cấp đầy đủ thông tin bắt buộc'
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const highlight = await Highlight.create({
      title,
      slug,
      description,
      videoUrl,
      thumbnailImage,
      duration,
      matchId,
      leagueId,
      goals,
      isVip: isVip || false,
      isPublished: true,
    });

    return sendSuccess(
      res,
      highlight,
      'Tạo highlight thành công',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/sports/admin/highlights/:id
 * Xóa highlight
 * @access Admin
 */
exports.deleteHighlight = async (req, res, next) => {
  try {
    const { id } = req.params;

    const highlight = await Highlight.findByIdAndDelete(id);
    if (!highlight) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Video highlight không tồn tại'
      );
    }

    return sendSuccess(
      res,
      { _id: id },
      'Xóa highlight thành công'
    );
  } catch (error) {
    next(error);
  }
};
