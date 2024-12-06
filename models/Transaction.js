const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./User');

const TransactionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ['Income', 'Expense'],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

TransactionSchema.methods.getUser = async function () {
  return await User.findById(this.user);
};

module.exports = mongoose.model('Transaction', TransactionSchema);
