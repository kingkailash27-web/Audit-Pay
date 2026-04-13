🛡️ AuditPayA Secure Payroll Management & Financial Audit SystemAuditPay is a full-stack web application developed as a comprehensive Database Management System (DBMS) college project for the B.Tech Artificial Intelligence and Robotics curriculum at VIT Chennai. It is designed to automate corporate payroll, manage daily attendance, and maintain an immutable financial audit trail.Built with the MERN stack, it features a strict three-tier role hierarchy separating administrative control, operational execution, and employee self-service.Developed by: KAILASH P (24BRS1382)

🚀 Tech StackFrontend: React.js (Vite), Tailwind CSS / CSS Modules (Enterprise Dark Mode UI), Recharts (Data Visualization)Backend: Node.js, Express.jsDatabase: MongoDB & Mongoose (Database: Audit Payn)Authentication: JSON Web Tokens (JWT), bcryptjsTools: Git, html2pdf.js / react-to-pdf
📁 Project StructurePlaintext.
├── backend/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md

🧰 PrerequisitesNode.js (>= 16.x)MongoDB (Local instance or MongoDB Atlas URI)npm or yarn package manager🏁 Running LocallyBackendOpen a terminal and navigate to the backend directory:Bashcd backend
Install Node dependencies:Bashnpm install
Set environment variables by creating a .env file in the backend directory:Code snippetPORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
Run the API server:Bashnpm run dev
FrontendOpen a new terminal window and navigate to the frontend directory:Bashcd frontend
Install Node dependencies:Bashnpm install
Start the Vite development server:Bashnpm run dev
Open your browser at http://localhost:5173 (or the port Vite reports).

🚀 Key Features
🔴 Admin (Supreme Command)System Configuration: Dynamically control global financial policies (Tax and PF percentages).Leave Command Center: Approve or reject employee leave requests.Advanced Analytics: View real-time system insights via Recharts.Employee Management: Complete CRUD access for the database and mock data generation.Master Audit Access: View the unrestricted, system-wide Audit_Log.
🟡 Payroll & Attendance Officer (PAO)Operational Attendance: Track and update daily employee attendance.Automated Payroll Runner: Generate monthly payrolls based on automated leave deductions.Financial Disbursement: Review pending payrolls and mark them as "Paid".Filtered Logs: View domain-specific audit logs.
🟢 Employee (Self-Service Portal)Dashboard Overview: View current base salary, monthly leaves, and estimated net pay.Attendance & Leaves: View personal attendance history and submit date-ranged leave requests.Salary History: Access finalized payslips and download them instantly as PDF documents.
🧮 The Financial Logic EngineThe DBMS incorporates an automated math engine for financial accuracy:Daily Rate: Base Salary / 30Leave Deductions: Days on Leave * Daily RateStandard Taxation: Strictly 10% of Base Salary.Provident Fund (PF): Strictly 5% of Base Salary (if PF is active).$$NetPay = BaseSalary - LeaveDeductions - Tax - PF$$
📦 DeploymentBuild frontend: Run npm run build in the frontend directory (outputs to dist/).Backend: Can be deployed to any Node.js-compatible host (e.g., Render, Railway, Heroku) with MongoDB Atlas acting as the cloud database.
📝 NotesEnsure all .env files are added to .gitignore before pushing to any public repository.To clear duplicate key errors in MongoDB during testing, ensure LeaveID_1 or similar outdated unique indexes are manually dropped via MongoDB Compass.
