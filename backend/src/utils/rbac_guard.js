const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'smashcourt_jwt_secret_key_9988';

/**
 * Middleware bảo mật & Phân quyền động (JWT Validation + PostgreSQL RBAC)
 * @param {string} requiredController - Tên phân hệ (ví dụ: 'Bookings', 'Courts', 'Revenue')
 * @param {string} requiredAction - Hành động (ví dụ: 'Create', 'Confirm', 'UpdateStatus', 'View')
 */
const authorize = (requiredController, requiredAction) => {
  return async (req, res, next) => {
    // 1. Kiểm tra JWT token gửi lên từ client
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Bạn cần đăng nhập để thực hiện chức năng này!' });
    }

    const token = authHeader.split(' ')[1];

    try {
      // 2. Giải mã token
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Gán payload vào request

      // 3. Truy vấn phân quyền trong database PostgreSQL
      const query = `
        SELECT 
          pl.controller_name,
          pl.action_name
        FROM user_role ur
        JOIN role_permision rp ON ur.role_id = rp.role_id
        JOIN permision_lines pl ON rp.permision_id = pl.permision_id
        WHERE ur.user_id = $1
      `;
      const result = await db.query(query, [decoded.id]);
      const permissions = result.rows;

      // 4. Kiểm tra quyền hạn tương ứng
      const hasPermission = permissions.some(p => 
        p.controller_name.toLowerCase() === requiredController.toLowerCase() &&
        p.action_name.toLowerCase() === requiredAction.toLowerCase()
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          error: `Tài khoản của bạn không được cấp quyền thực hiện chức năng này (${requiredController}/${requiredAction})!` 
        });
      }

      // Có đầy đủ quyền, tiếp tục chạy route tiếp theo
      next();
    } catch (error) {
      console.error('Lỗi phân quyền RBAC Guard:', error.message);
      return res.status(401).json({ success: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn!' });
    }
  };
};

module.exports = authorize;
