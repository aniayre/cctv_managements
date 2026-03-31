const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { verifyToken, allowRoles } = require("./middleware/authRole");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:4200",
  "https://lightpink-heron-320777.hostingersite.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  }),
);
app.set("trust proxy", 1);
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});
app.use(express.json());

/* ===========================
   MYSQL CONNECTION
=========================== */

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
});

db.getConnection((err, connection) => {
  if (err) {
    console.log("Database connection error:", err);
  } else {
    console.log("MySQL Connected");
    connection.release();
  }
});
/* ===========================
   REGISTER USER
=========================== */

app.post("/register", async (req, res) => {
  const { name, email, phone, designation, password } = req.body;

  if (!name || !email || !phone || !designation || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (name, email, phone, designation, password)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [name, email, phone, designation, hashedPassword],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res
              .status(400)
              .json({ message: "Email or Phone already exists" });
          }
          return res.status(500).json(err);
        }

        res.json({
          message: "User Registered Successfully",
        });
      },
    );
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

/* ===========================
   LOGIN
=========================== */

app.post("/login", (req, res) => {
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const sql = `
    SELECT * FROM users
    WHERE email = ? OR phone = ?
  `;

  db.query(sql, [emailOrPhone, emailOrPhone], async (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        designation: user.designation,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({
      message: "Login successful",
      token,
      designation: user.designation,
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        designation: user.designation,
      },
    });
  });
});

/* ===========================
   DASHBOARD TEST
=========================== */

app.get("/dashboard", verifyToken, (req, res) => {
  res.json({ message: "Welcome to Dashboard" });
});

/* ===========================
   TECHNICIAN LIST
=========================== */

app.get(
  "/technician-list",
  verifyToken,
  allowRoles("Admin", "Operator"),
  (req, res) => {
    const sql = `
      SELECT id, name
      FROM users
      WHERE designation = 'Technician'
      AND status = 'active'
    `;

    db.query(sql, (err, result) => {
      if (err) return res.status(500).send(err);

      res.json(result);
    });
  },
);
/* ===========================
   GET ALL JOBS
=========================== */

app.get("/jobs", verifyToken, allowRoles("Admin", "Operator"), (req, res) => {
  const sql = `
    SELECT j.*, u.name AS technician_name
    FROM jobs j
    LEFT JOIN users u ON j.technician_id = u.id
    ORDER BY j.created_at DESC`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).send(err);

    res.json(result);
  });
});

/* ===========================
   ADD JOB
=========================== */

app.post("/jobs", verifyToken, allowRoles("Operator"), (req, res) => {
  const {
    customer_name,
    mobile,
    location,
    issue,
    technician_id,
    amount,
    priority,
    remark,
    job_status,
    payment_status,
  } = req.body;

  const sql = `
    INSERT INTO jobs
    (customer_name, mobile, location, issue, technician_id, amount, priority, remark, job_status, payment_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      customer_name,
      mobile,
      location,
      issue,
      technician_id,
      amount || 0,
      priority || "Medium",
      remark || "",
      job_status || "Pending",
      payment_status || "Pending",
    ],
    (err) => {
      if (err) {
        console.log("MYSQL ERROR:", err);
        return res.status(500).send(err);
      }

      res.send({ message: "Job Added Successfully" });
    },
  );
});

/* ===========================
   TECHNICIAN JOB LIST
=========================== */

app.get(
  "/technician/jobs/:id",
  verifyToken,
  allowRoles("Technician", "Admin"),
  (req, res) => {
    const techId = req.user.id;

    if (req.user.designation === "Admin") {
      const sql = `
      SELECT j.*, u.name AS technician_name
      FROM jobs j
      LEFT JOIN users u ON j.technician_id = u.id
      ORDER BY j.created_at DESC
    `;

      db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);

        res.json(result);
      });
    } else {
      const sql = `
      SELECT j.*, u.name AS technician_name
      FROM jobs j
      LEFT JOIN users u ON j.technician_id = u.id
      WHERE j.technician_id = ?
      ORDER BY j.created_at DESC
    `;

      db.query(sql, [techId], (err, result) => {
        if (err) return res.status(500).send(err);

        res.json(result);
      });
    }
  },
);

/* ===========================
   TECHNICIAN UPDATE JOB
=========================== */

app.put(
  "/technician/jobs/:id",
  verifyToken,
  allowRoles("Technician"),
  (req, res) => {
    const jobId = req.params.id;
    const techId = req.user.id;

    const { job_status, payment_status, payment_method, amount, remark } =
      req.body;

    const historySql = `
      INSERT INTO job_history
      (job_id, technician_id, job_status, payment_status, payment_method, amount, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      historySql,
      [
        jobId,
        techId,
        job_status,
        payment_status,
        payment_method,
        amount,
        remark,
      ],
      (err) => {
        if (err) return res.status(500).send(err);

        const updateSql = `
          UPDATE jobs
          SET job_status = ?, 
              payment_status = ?, 
              payment_method = ?, 
              amount = ?, 
              remark = ?
          WHERE id = ? AND technician_id = ?
        `;

        db.query(
          updateSql,
          [
            job_status,
            payment_status,
            payment_method,
            amount,
            remark,
            jobId,
            techId,
          ],
          (err) => {
            if (err) return res.status(500).send(err);

            res.send({ message: "Job updated and history saved" });
          },
        );
      },
    );
  },
);

/* ===========================
   UPDATE JOB (Operator/Admin)
=========================== */

app.put(
  "/jobs/:id",
  verifyToken,
  allowRoles("Operator", "Admin"),
  (req, res) => {
    const jobId = req.params.id;

    const {
      customer_name,
      mobile,
      location,
      issue,
      technician_id,
      priority,
      remark,
    } = req.body;

    const sql = `
      UPDATE jobs
      SET customer_name = ?,
          mobile = ?,
          location = ?,
          issue = ?,
          technician_id = ?,
          priority = ?,
          remark = ?
      WHERE id = ?
    `;

    db.query(
      sql,
      [
        customer_name,
        mobile,
        location,
        issue,
        technician_id,
        priority,
        remark,
        jobId,
      ],
      (err) => {
        if (err) {
          console.log("MYSQL ERROR:", err);
          return res.status(500).send(err);
        }

        res.json({ message: "Job updated successfully" });
      },
    );
  },
);

/* ===========================
   REASSIGN TECHNICIAN
=========================== */

app.put(
  "/jobs/reassign/:id",
  verifyToken,
  allowRoles("Operator", "Admin"),
  (req, res) => {
    const jobId = req.params.id;
    const { technician_id, issue } = req.body;

    const sql = `
      UPDATE jobs
      SET technician_id = ?,
          issue = ?,
          job_status = 'Pending',
          payment_status = 'Pending'
      WHERE id = ?
    `;

    db.query(sql, [technician_id, issue, jobId], (err) => {
      if (err) return res.status(500).send(err);

      res.send({ message: "Job reassigned successfully" });
    });
  },
);

// API to Show Job History ///
app.get("/jobs/history/:jobId", verifyToken, (req, res) => {
  const jobId = req.params.jobId;

  const sql = `
    SELECT h.*, u.name as technician_name
    FROM job_history h
    LEFT JOIN users u ON h.technician_id = u.id
    WHERE h.job_id = ?
    ORDER BY h.updated_at DESC
  `;

  db.query(sql, [jobId], (err, result) => {
    if (err) {
      console.log("MYSQL ERROR:", err);
      return res.status(500).send(err);
    }

    res.json(result);
  });
});

app.delete(
  "/jobs/:id",
  verifyToken,
  allowRoles("Admin", "Operator"),
  (req, res) => {
    const jobId = req.params.id;

    const sql = "DELETE FROM jobs WHERE id = ?";

    db.query(sql, [jobId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ message: "Job deleted successfully" });
    });
  },
);

/* ===========================
   GET STAFF LIST (SETTINGS)
=========================== */

app.get("/api/staff", verifyToken, allowRoles("Admin"), (req, res) => {
  const sql = `
      SELECT id, name, designation, status
      FROM users
      WHERE designation IN ('Technician','Operator')
    `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).send(err);

    res.json(result);
  });
});
/* ===========================
   UPDATE STAFF STATUS
=========================== */

app.put(
  "/api/staff/:id/status",
  verifyToken,
  allowRoles("Admin"),
  (req, res) => {
    const staffId = req.params.id;
    const { status } = req.body;

    const sql = `
      UPDATE users
      SET status = ?
      WHERE id = ?
    `;

    db.query(sql, [status, staffId], (err) => {
      if (err) return res.status(500).send(err);

      res.json({ message: "Status updated successfully" });
    });
  },
);
/* ===========================
   START SERVER
=========================== */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
