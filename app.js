import express from 'express';   // นำเข้า express ซึ่งเป็น framework สำหรับสร้าง server
import pg from 'pg'; // นำเข้า pg ซึ่งเป็น PostgreSQL client สำหรับ Node.js
import bodyParser from 'body-parser'; // นำเข้า body-parser เพื่อช่วยในการแยกข้อมูลที่ส่งจากฟอร์ม
import path from 'path'; // นำเข้า path เพื่อจัดการกับเส้นทางไฟล์
import { fileURLToPath } from 'url'; // นำเข้า fileURLToPath เพื่อแปลง URL เป็น path

const app = express(); // สร้าง instance ของ express
const router = express.Router(); // สร้าง router สำหรับจัดการเส้นทาง
const port = 3000; // กำหนด port ที่ server จะทำงาน

const { Pool } = pg; // สร้าง Pool จาก pg เพื่อจัดการการเชื่อมต่อกับฐานข้อมูล

// แปลง import.meta.url ให้ได้ __dirname
const __filename = fileURLToPath(import.meta.url); // แปลง URL ของไฟล์ปัจจุบันให้เป็น path
const __dirname = path.dirname(__filename); // หาชื่อ directory ของไฟล์ปัจจุบัน

// Middleware เพื่อแยกข้อมูลฟอร์ม
app.use(bodyParser.urlencoded({ extended: true })); // ใช้ body-parser เพื่อแยกข้อมูลฟอร์มที่ถูกส่ง

// กำหนดให้ใช้ EJS เป็น templating engine
app.set('view engine', 'ejs'); // กำหนดให้ใช้ EJS เป็น templating engine
app.set('views', path.join(__dirname, 'views')); // กำหนดเส้นทางสำหรับโฟลเดอร์ views

// สร้าง connection pool สำหรับ PostgreSQL
const pool = new Pool({
    host: 'localhost', // กำหนด host ของฐานข้อมูล
    port: 5432, // กำหนด port ของฐานข้อมูล
    user: 'postgres', // กำหนด username สำหรับการเชื่อมต่อ
    password: '0994150630', // กำหนด password สำหรับการเชื่อมต่อ
    database: 'my_work', // กำหนดชื่อฐานข้อมูล
});

// เสิร์ฟฟอร์ม (index.ejs)
app.get('/', async (req, res) => {  // สร้าง route สำหรับหน้าแรก
    try {
        const result = await pool.query('SELECT * FROM student'); // ดึงข้อมูลจากตาราง student
        const students = result.rows; // เก็บข้อมูลในตัวแปร students
        res.render('index', { students }); // Render หน้า index.ejs พร้อมส่งข้อมูล students
    } catch (err) {
        console.error('Error fetching students:', err); // แสดงข้อความผิดพลาดใน console
        res.status(500).send('Error fetching students'); // ส่งสถานะ 500 ถ้ามีข้อผิดพลาด
    }
});

// Route เพื่อแสดงข้อมูลการ check-in
app.get('/checkin', async (req, res) => { // สร้าง route สำหรับหน้า check-in
    try {
        // คำสั่ง SQL เพื่อดึงข้อมูลการ check-in
        const result = await pool.query(` 
            SELECT 
                sl.id, 
                sl.active_date, 
                sl.status,
                s.first_name, 
                s.last_name 
            FROM student_list sl
            JOIN student s ON sl.student_id = s.id
        `);
        const studentLists = result.rows; // เก็บข้อมูลการ check-in ในตัวแปร studentLists
        res.render('checkin', { studentLists }); // Render หน้า checkin.ejs พร้อมส่งข้อมูล studentLists
    } catch (err) {
        console.error('Error fetching check-in data:', err); // แสดงข้อความผิดพลาดใน console
        res.status(500).send('Error fetching check-in data'); // ส่งสถานะ 500 ถ้ามีข้อผิดพลาด
    }
});

// Route สำหรับหน้า p1
app.get('/p1', async (req, res) => { // สร้าง route สำหรับหน้า p1
    try {
        let query = `
        SELECT s.id, s.first_name, s.last_name, s.date_of_birth, c.short_name_en AS curriculum, s.email
        FROM student s
        JOIN curriculum c ON s.curriculum_id = c.id
    `;
        const result = await pool.query('SELECT * FROM student'); // ดึงข้อมูลนักเรียนจากตาราง student
        res.render('p1', { users: result.rows }); // ส่งข้อมูลไปยังไฟล์ EJS
    } catch (error) {
        console.error('Error executing query', error.stack); // แสดงข้อผิดพลาดใน console
        res.status(500).send('Server Error'); // ส่งสถานะ 500 ถ้ามีข้อผิดพลาด
    }
});

// Route สำหรับหน้า index
app.get('/index', async (req, res) => { // สร้าง route สำหรับหน้า index
    try {
        const result = await pool.query('SELECT * FROM student'); // Query ข้อมูลนักเรียนจากตาราง student
        const students = result.rows; // ดึงข้อมูลที่ query มาเก็บในตัวแปร students
        res.render('index', { students }); // ส่งตัวแปร students ไปที่หน้า index.ejs
    } catch (err) {
        console.error('Error fetching students:', err); // แสดง error ถ้าการ query ข้อมูลล้มเหลว
        res.status(500).send('Error fetching students'); // ส่งสถานะ 500 ถ้ามีข้อผิดพลาด
    }
});



// Route สำหรับการเพิ่มข้อมูลนักเรียน
app.post('/students', async (req, res) => { // สร้าง route สำหรับรับข้อมูลนักเรียน
    const { prefix_id, first_name, last_name, date_of_birth, curriculum_id, previous_school, address, telephone, email, line_id } = req.body; // รับข้อมูลจากฟอร์ม

    try {
 // สร้างคำสั่ง SQL สำหรับเพิ่มข้อมูลนักเรียน
        await pool.query(` 
            INSERT INTO student 
            (prefix_id, first_name, last_name, date_of_birth, curriculum_id, previous_school, address, telephone, email, line_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, 
        [prefix_id, first_name, last_name, date_of_birth, curriculum_id, previous_school, address, telephone, email, line_id]); // ส่งค่าลงในคำสั่ง SQL
        
        res.redirect('/p1'); // กลับไปที่หน้าฟอร์มหลังจากบันทึกข้อมูลเสร็จสิ้น
    } catch (error) {
        console.error('Error inserting student:', error); // แสดงข้อผิดพลาดใน console
        res.status(500).send('Internal Server Error'); // ส่งสถานะ 500 ถ้ามีข้อผิดพลาด
    }
});

// Route เพื่อบันทึกการเข้าชั้นเรียน
app.post('/save-attendance', async (req, res) => { // สร้าง route สำหรับบันทึกการเข้าชั้นเรียน
    const attendanceData = req.body; // รับข้อมูลจากฟอร์ม

    const sectionId = 1; // กำหนด section_id ที่ต้องการบันทึก
    const activeDate = new Date(); // วันที่บันทึกข้อมูลเป็นวันที่ปัจจุบัน

    try {
        const queries = []; // สร้าง array สำหรับเก็บคำสั่ง SQL

        // ตรวจสอบนักเรียนแต่ละคน
        for (const key in attendanceData) { // วนลูปเพื่อเช็คข้อมูล attendance
            if (key.startsWith('attendance_')) { // ตรวจสอบว่าชื่อ key เริ่มต้นด้วย 'attendance_'
                const studentId = key.split('_')[1]; // แยก student ID
                const status = attendanceData[key]; // ได้สถานะที่ส่งมา (Y หรือ N)

                // สร้างคำสั่ง SQL สำหรับบันทึกข้อมูลการเข้าชั้นเรียน
                queries.push(pool.query(`
                    INSERT INTO student_list (section_id, student_id, active_date, status)
                    VALUES ($1, $2, $3, $4)
                `, [sectionId, studentId, activeDate, status])); // ใส่ค่าลงในคำสั่ง SQL
            }
        }

        await Promise.all(queries); // รอให้คำสั่ง SQL ทั้งหมดทำงานเสร็จ
        res.send('Attendance saved successfully!'); // ส่งข้อความยืนยันการบันทึก
    } catch (error) {
        console.error('Error saving attendance:', error); // แสดงข้อความผิดพลาดใน console
        res.status(500).send('Error saving attendance.'); // ส่งสถานะ 500 ถ้ามีข้อผิดพลาด
    }
});

// เริ่มต้น server
app.listen(port, () => { // เริ่มต้น server
    console.log(`Server is running on http://localhost:${port}`); // แสดงข้อความใน console ว่า server เริ่มทำงานที่ port ที่กำหนด
});

export default router;  // ส่งออก router สำหรับการใช้งานในไฟล์อื่น
