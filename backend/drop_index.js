const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/Audit_Payn';

async function dropIndex() {
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        console.log('Connected to MongoDB');
        
        const result = await db.collection('Attendance').dropIndex('LeaveID_1');
        console.log('Successfully dropped LeaveID_1 index from Attendance collection:', result);
    } catch (err) {
        console.error('Error dropping index (it may not exist anymore):', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

dropIndex();
