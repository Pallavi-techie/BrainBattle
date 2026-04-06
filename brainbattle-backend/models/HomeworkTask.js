const mongoose = require('mongoose');

const homeworkTaskSchema = new mongoose.Schema({
  circle:    { type: mongoose.Schema.Types.ObjectId, ref: 'StudyCircle', required: true },
  title:     { type: String, required: true },
  subject:   { type: String, required: true },
  dueDate:   { type: Date },
  status:    { type: String, enum: ['todo', 'doing', 'done'], default: 'todo' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('HomeworkTask', homeworkTaskSchema);
