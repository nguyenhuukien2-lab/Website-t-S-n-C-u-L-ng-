const express = require('express');
const router = express.Router();
const db = require('../db');
const authorize = require('../utils/rbac_guard');

// GET /api/courts - Lấy danh sách sân từ database
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM courts ORDER BY id ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sân:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi server khi lấy danh sách sân' });
  }
});

// GET /api/courts/:id - Lấy thông tin 1 sân từ database
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM courts WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sân' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin sân:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi server khi lấy thông tin sân' });
  }
});

// PUT /api/courts/:id/status - Cập nhật trạng thái hoạt động/bảo trì của sân
router.put('/:id/status', authorize('Courts', 'UpdateStatus'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'available' | 'maintenance'

  if (!status) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp trạng thái mới' });
  }

  try {
    const checkCourt = await db.query('SELECT * FROM courts WHERE id = $1', [id]);
    if (checkCourt.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sân tương ứng' });
    }

    const updateQuery = 'UPDATE courts SET status = $1 WHERE id = $2 RETURNING *';
    const result = await db.query(updateQuery, [status.toLowerCase(), id]);
    const updatedCourt = result.rows[0];

    res.json({ 
      success: true, 
      message: `Đã cập nhật trạng thái sân thành ${status === 'available' ? 'Đang hoạt động' : 'Bảo trì'}!`,
      data: updatedCourt 
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái sân:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi server khi cập nhật trạng thái sân' });
  }
});

module.exports = router;
