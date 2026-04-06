const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['student', 'admin'], default: 'student' },
  class:     { type: Number, min: 1, max: 12 },
  school:    { type: String, trim: true },
  board:     { type: String, enum: ['CBSE', 'GSEB', 'SSC', 'ICSE'] },
  language:  { type: String, enum: ['en', 'hi', 'gu'], default: 'en' },
  coins:     { type: Number, default: 0 },
  streak:    { type: Number, default: 0 },
  lastLogin: { type: Date },
  badges:    [{ type: String }],
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
