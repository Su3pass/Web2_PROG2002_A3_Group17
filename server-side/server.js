const express = require('express');
const cors = require('cors');
const connection = require('./event_db');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ============================================
// 活动相关API (Events)
// ============================================

// 1. 获取所有活跃活动
app.get('/api/events', (req, res) => {
  const query = `
    SELECT e.*, c.name AS category_name 
    FROM events e 
    JOIN categories c ON e.category_id = c.id 
    WHERE e.is_active = TRUE
    ORDER BY e.date ASC
  `;
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// 2. 获取活动详情（包含注册列表）
app.get('/api/events/:id', (req, res) => {
  const eventId = req.params.id;
  
  // 获取活动信息
  const eventQuery = `
    SELECT e.*, c.name AS category_name 
    FROM events e 
    JOIN categories c ON e.category_id = c.id 
    WHERE e.id = ?
  `;
  
  connection.query(eventQuery, [eventId], (err, eventResults) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (eventResults.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // 获取该活动的注册列表（按注册日期倒序）
    const registrationsQuery = `
      SELECT * FROM registrations 
      WHERE event_id = ? 
      ORDER BY registration_date DESC
    `;
    
    connection.query(registrationsQuery, [eventId], (err, regResults) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // 合并结果
      const event = eventResults[0];
      event.registrations = regResults;
      res.json(event);
    });
  });
});

// 3. 搜索活动
app.get('/api/events/search', (req, res) => {
  const { category, location, date } = req.query;
  let query = `
    SELECT e.*, c.name AS category_name 
    FROM events e 
    JOIN categories c ON e.category_id = c.id 
    WHERE e.is_active = TRUE
  `;
  let params = [];

  if (category) {
    query += ` AND c.name = ?`;
    params.push(category);
  }
  if (location) {
    query += ` AND e.location LIKE ?`;
    params.push(`%${location}%`);
  }
  if (date) {
    query += ` AND DATE(e.date) = ?`;
    params.push(date);
  }

  query += ` ORDER BY e.date ASC`;

  connection.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// 4. 创建新活动 (Admin API)
app.post('/api/events', (req, res) => {
  const { name, description, date, location, latitude, longitude, ticket_price, goal_amount, category_id } = req.body;
  
  // 验证必填字段
  if (!name || !date || !location || !category_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const query = `
    INSERT INTO events (name, description, date, location, latitude, longitude, ticket_price, goal_amount, current_amount, category_id, is_active) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1)
  `;
  
  const values = [
    name, 
    description || null, 
    date, 
    location, 
    latitude || null, 
    longitude || null, 
    ticket_price || 0, 
    goal_amount || 0, 
    category_id
  ];
  
  connection.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ 
      message: 'Event created successfully', 
      id: result.insertId 
    });
  });
});

// 5. 更新活动 (Admin API)
app.put('/api/events/:id', (req, res) => {
  const eventId = req.params.id;
  const { name, description, date, location, latitude, longitude, ticket_price, goal_amount, current_amount, category_id, is_active } = req.body;
  
  const query = `
    UPDATE events 
    SET name = ?, description = ?, date = ?, location = ?, latitude = ?, longitude = ?, 
        ticket_price = ?, goal_amount = ?, current_amount = ?, category_id = ?, is_active = ?
    WHERE id = ?
  `;
  
  const values = [
    name, 
    description, 
    date, 
    location, 
    latitude, 
    longitude, 
    ticket_price, 
    goal_amount, 
    current_amount, 
    category_id, 
    is_active, 
    eventId
  ];
  
  connection.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event updated successfully' });
  });
});

// 6. 删除活动 (Admin API) - 检查是否有注册
app.delete('/api/events/:id', (req, res) => {
  const eventId = req.params.id;
  
  // 首先检查是否有注册
  const checkQuery = 'SELECT COUNT(*) as count FROM registrations WHERE event_id = ?';
  
  connection.query(checkQuery, [eventId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (results[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete event with existing registrations',
        registrations_count: results[0].count 
      });
    }
    
    // 没有注册，可以删除
    const deleteQuery = 'DELETE FROM events WHERE id = ?';
    connection.query(deleteQuery, [eventId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.json({ message: 'Event deleted successfully' });
    });
  });
});

// ============================================
// 注册相关API (Registrations)
// ============================================

// 7. 创建新注册
app.post('/api/registrations', (req, res) => {
  const { event_id, full_name, email, phone, tickets_count } = req.body;
  
  // 验证必填字段
  if (!event_id || !full_name || !email || !tickets_count) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // 检查是否已经注册过该活动
  const checkQuery = 'SELECT * FROM registrations WHERE event_id = ? AND email = ?';
  connection.query(checkQuery, [event_id, email], (err, existingReg) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (existingReg.length > 0) {
      return res.status(400).json({ error: 'You have already registered for this event' });
    }
    
    // 获取活动信息以计算总金额
    const eventQuery = 'SELECT ticket_price FROM events WHERE id = ?';
    connection.query(eventQuery, [event_id], (err, eventResults) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (eventResults.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      const total_amount = eventResults[0].ticket_price * tickets_count;
      
      // 插入注册记录
      const insertQuery = `
        INSERT INTO registrations (event_id, full_name, email, phone, tickets_count, total_amount) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      connection.query(insertQuery, [event_id, full_name, email, phone, tickets_count, total_amount], (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ 
          message: 'Registration successful', 
          id: result.insertId,
          total_amount: total_amount
        });
      });
    });
  });
});

// ============================================
// 分类相关API (Categories)
// ============================================

// 8. 获取所有分类
app.get('/api/categories', (req, res) => {
  connection.query('SELECT * FROM categories ORDER BY name', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// ============================================
// 静态文件服务
// ============================================

// 托管客户端静态文件
app.use('/client', express.static(path.join(__dirname, '..', 'client-side')));

// 托管管理端静态文件
app.use('/admin', express.static(path.join(__dirname, '..', 'admin-side')));

// 根路径重定向到客户端
app.get('/', (req, res) => {
  res.redirect('/client/index.html');
});

// ============================================
// 启动服务器
// ============================================

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`📱 Client: http://localhost:${port}/client`);
  console.log(`🔧 Admin: http://localhost:${port}/admin`);
});