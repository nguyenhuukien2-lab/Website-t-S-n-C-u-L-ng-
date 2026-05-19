const express = require('express');
const router = express.Router();
const db = require('../db');

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

module.exports = router;
